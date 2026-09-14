#!/usr/bin/env python3
"""Session handoff: one small packet carried from the Session being left to the next one.

Three entry points share the packet format defined here:

- hook mode (stdin event, no arguments): on an explicit $handoff prompt, tell the model
  which Session it is writing from. The model cannot see its own rollout id.
- `write --session <id>` (packet body on stdin): the only write path. It validates the
  packet before overwriting, so a rejected packet never replaces the previous good one.
- `read_context()`: imported by time_sync.py, which injects the packet on $time-sync.

The file is overwritten by every $handoff. It is warm context for the next Session, not
memory: whatever deserves keeping belongs somewhere durable. See the kit README.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
# Override with SESSION_HANDOFF_PATH; tests use it so they never touch a real packet.
HANDOFF_PATH = Path(os.environ.get("SESSION_HANDOFF_PATH", ROOT / ".session-continuity" / "handoff.md"))
# A directory with this name is created for the packet alone, so it may safely ignore itself.
PRIVATE_DIRECTORY = ".session-continuity"

MENTION = re.compile(r"(?<![\w-])\$handoff(?![\w-])")
SESSION_ID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
ROLLOUT_NAME = re.compile(rf"^rollout-.+-({SESSION_ID.pattern})\.jsonl$")

# Section heading -> (minimum, maximum) content lines. Order is fixed.
SECTIONS = (("Mood", 1, 1), ("Unfinished", 0, 2), ("Phrases", 0, 3), ("Last topic", 1, 1))
BULLETED = {"Unfinished", "Phrases"}
MAX_BODY_CHARS = 800
MAX_LINE_CHARS = 160

# The goodbye exchange right after $handoff is expected; activity beyond this is not covered.
SOURCE_GRACE = timedelta(minutes=10)
LONG_GAP = timedelta(days=7)


def format_gap(seconds: int) -> str:
    parts = []
    for suffix, size in (("d", 86_400), ("h", 3_600), ("m", 60), ("s", 1)):
        value, seconds = divmod(seconds, size)
        if value:
            parts.append(f"{value}{suffix}")
    return " ".join(parts) or "0s"


def session_id_from(transcript: object) -> str | None:
    if not isinstance(transcript, str) or not transcript:
        return None
    match = ROLLOUT_NAME.match(Path(transcript).name)
    return match.group(1) if match else None


def body_errors(body: str) -> list[str]:
    """Check the model-written part of the packet against the fixed template."""
    if len(body) > MAX_BODY_CHARS:
        return [f"body has {len(body)} characters; the limit is {MAX_BODY_CHARS}"]
    errors = []
    found: list[tuple[str, list[str]]] = []
    for line in body.splitlines():
        line = line.rstrip()
        if line.startswith("## "):
            found.append((line[3:].strip(), []))
        elif line:
            if not found:
                errors.append(f"text before the first section: {line[:40]!r}")
                continue
            found[-1][1].append(line)
        if len(line) > MAX_LINE_CHARS:
            errors.append(f"line longer than {MAX_LINE_CHARS} characters: {line[:40]!r}")

    expected = [name for name, _, _ in SECTIONS]
    if [name for name, _ in found] != expected:
        errors.append(f"sections must be exactly {', '.join(expected)}, in that order")
        return errors
    for (name, low, high), (_, lines) in zip(SECTIONS, found):
        if not low <= len(lines) <= high:
            errors.append(f"{name} needs {low}-{high} lines, got {len(lines)}")
        if name in BULLETED and any(not line.startswith("- ") for line in lines):
            errors.append(f"{name} lines must start with '- '")
    return errors


def parse_packet(text: str) -> tuple[dict[str, str], str, list[str]]:
    header_text, _, body = text.partition("\n\n")
    header = {}
    for line in header_text.splitlines():
        key, sep, value = line.partition(": ")
        if sep:
            header[key] = value.strip()
    errors = []
    if not SESSION_ID.fullmatch(header.get("source_session", "")):
        errors.append("missing or malformed source_session")
    try:
        written = datetime.fromisoformat(header.get("written_at", ""))
        if written.tzinfo is None:
            errors.append("written_at has no UTC offset")
    except ValueError:
        errors.append("missing or malformed written_at")
    body = body.strip("\n")
    return header, body, errors + body_errors(body)


def write_packet(session: str, body: str, path: Path = HANDOFF_PATH) -> list[str]:
    if not SESSION_ID.fullmatch(session):
        return [f"malformed session id: {session!r}"]
    body = body.strip("\n")
    errors = body_errors(body)
    if errors:
        return errors
    written_at = datetime.now().astimezone().isoformat(timespec="seconds")
    text = f"source_session: {session}\nwritten_at: {written_at}\n\n{body}\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    ignore = path.parent / ".gitignore"
    if path.parent.name == PRIVATE_DIRECTORY and not ignore.exists():
        # Mood notes must never reach a commit by accident.
        ignore.write_text("*\n", encoding="utf-8")
    # The packet holds private conversational notes: write owner-only, then swap in.
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix=".session_handoff.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(text)
        os.replace(temp, path)
    except BaseException:
        Path(temp).unlink(missing_ok=True)
        raise
    return []


def is_repo_conversation(rollout: Path) -> bool:
    """True for a user-facing Codex thread in this repository, not a subagent or reviewer."""
    try:
        with rollout.open(encoding="utf-8") as stream:
            record = json.loads(stream.readline())
    except (OSError, ValueError):
        return False
    payload = record.get("payload")
    if record.get("type") != "session_meta" or not isinstance(payload, dict):
        return False
    cwd = payload.get("cwd")
    # Subagents, guardian reviews and agent-created threads all carry another thread_source;
    # rollouts from before thread_source existed are user threads.
    return (
        isinstance(cwd, str)
        and Path(cwd).resolve() == ROOT
        and payload.get("thread_source") in (None, "user")
    )


def later_activity(transcript: Path, current: str | None, source: str, written: datetime) -> datetime | None:
    """Latest activity in this repository's Codex conversations that the handoff cannot cover."""
    sessions = transcript.parents[3] if len(transcript.parents) > 3 else None
    if sessions is None or sessions.name != "sessions":
        return None
    latest = None
    for rollout in sessions.glob("*/*/*/rollout-*.jsonl"):
        match = ROLLOUT_NAME.match(rollout.name)
        if not match or match.group(1) == current:
            continue
        cutoff = written + SOURCE_GRACE if match.group(1) == source else written
        try:
            modified = datetime.fromtimestamp(rollout.stat().st_mtime).astimezone()
        except OSError:
            continue
        if modified > cutoff and (latest is None or modified > latest) and is_repo_conversation(rollout):
            latest = modified
    return latest


def already_injected(transcript: Path, marker: str) -> bool:
    try:
        with transcript.open(encoding="utf-8", errors="replace") as stream:
            return any(marker in line for line in stream)
    except OSError:
        return False


def read_context(transcript: object, now: datetime) -> str:
    """The SessionHandoff block time_sync.py appends to TemporalSync."""
    try:
        text = HANDOFF_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "SessionHandoff unavailable: no handoff has been written."
    except OSError:
        return "SessionHandoff error=handoff unreadable. Do not guess its content."
    header, body, errors = parse_packet(text)
    if errors:
        return f"SessionHandoff error={errors[0]}. Do not guess its content."

    source = header["source_session"]
    current = session_id_from(transcript)
    if source == current:
        return "SessionHandoff omitted: it was written in this Session."
    marker = f"SessionHandoff source_session={source}; written_at={header['written_at']};"
    path = Path(transcript) if isinstance(transcript, str) and transcript else None
    if path is not None and already_injected(path, marker):
        return "SessionHandoff omitted: already provided earlier in this Session."

    written = datetime.fromisoformat(header["written_at"])
    age = now - written
    lines = [
        f"{marker} age={format_gap(max(0, round(age.total_seconds())))}. "
        "Host-read packet from a previous Session's $handoff: recorded observations, "
        "not verified current state."
    ]
    later = later_activity(path, current, source, written) if path is not None else None
    if later is not None:
        lines.append(
            f"SessionHandoff later_activity={later:%Y-%m-%d %H:%M:%S %Z (%z)}: Codex conversations "
            "in this repository continued after the handoff was written; it may not cover them."
        )
    if age > LONG_GAP:
        lines.append(
            f"SessionHandoff long_gap: older than {LONG_GAP.days}d; carry unfinished matters, "
            "do not resume the recorded tone."
        )
    return "\n".join(lines + [body])


def target_context(transcript: object) -> str:
    session = session_id_from(transcript)
    if session is None:
        return "HandoffTarget error=session id unavailable. Do not write a handoff."
    return f"HandoffTarget source_session={session}. Host-derived metadata requested by the user."


def hook_main() -> None:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        return
    prompt = event.get("prompt")
    if not isinstance(prompt, str) or not MENTION.search(prompt):
        return
    output = {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": target_context(event.get("transcript_path")),
    }
    print(json.dumps({"hookSpecificOutput": output}, ensure_ascii=False))


def main() -> int:
    if len(sys.argv) == 1:
        hook_main()
        return 0
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    write = commands.add_parser("write", help="validate a packet body from stdin and overwrite the handoff")
    write.add_argument("--session", required=True, help="source_session from HandoffTarget")
    args = parser.parse_args()

    errors = write_packet(args.session, sys.stdin.read())
    if errors:
        print("handoff rejected; the previous handoff is unchanged:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"handoff written: {HANDOFF_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
