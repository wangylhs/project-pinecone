#!/usr/bin/env python3
"""Inject temporal context, plus the session handoff, only for an explicit $time-sync prompt."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
import re
import sys

# Installed into someone else's repository: leave no __pycache__ behind in .codex/hooks.
sys.dont_write_bytecode = True
import session_handoff  # noqa: E402


# The CLI sends the mention as plain text ("$time-sync 我回来了"), but Codex Desktop
# serializes a skill picked from the composer as a markdown link, anywhere in the
# message ("我回来了 [$time-sync](/…/SKILL.md)"). Match the standalone mention in both.
MENTION = re.compile(r"(?<![\w-])\$time-sync(?![\w-])")

# User-role items Codex injects on its own; none of them is something the user sent.
INJECTED_TAGS = (
    "skill",
    "environment_context",
    "recommended_plugins",
    "turn_aborted",
    "heartbeat",
    "codex_delegation",
)


def is_injected(text: str) -> bool:
    text = text.lstrip()
    return text.startswith("# AGENTS.md instructions for ") or any(
        text.startswith(f"<{tag}>") and f"</{tag}>" in text for tag in INJECTED_TAGS
    )


def message_text(payload: dict) -> str:
    content = payload.get("content")
    if not isinstance(content, list):
        return ""
    return "\n".join(
        item["text"]
        for item in content
        if isinstance(item, dict)
        and item.get("type") == "input_text"
        and isinstance(item.get("text"), str)
        and not is_injected(item["text"])
    ).strip()


def previous_user_time(transcript: Path, prompt: str, now: datetime) -> datetime | None:
    messages: list[tuple[datetime, str]] = []
    with transcript.open(encoding="utf-8") as stream:
        for line in stream:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                # The final line may be incomplete while Codex is appending it.
                continue
            payload = record.get("payload")
            if (
                record.get("type") != "response_item"
                or not isinstance(payload, dict)
                or payload.get("type") != "message"
                or payload.get("role") != "user"
            ):
                continue
            text = message_text(payload)
            timestamp = record.get("timestamp")
            if text and isinstance(timestamp, str):
                messages.append((datetime.fromisoformat(timestamp.replace("Z", "+00:00")), text))

    # Codex may already have recorded the prompt this hook is running for.
    if (
        messages
        and messages[-1][1] == prompt.strip()
        and abs((now - messages[-1][0].astimezone()).total_seconds()) <= 60
    ):
        messages.pop()
    return messages[-1][0] if messages else None


def temporal_context(prompt: str, transcript: object) -> str:
    error = "TemporalSync error={}. Do not infer elapsed time."
    if not isinstance(transcript, str) or not transcript:
        return error.format("transcript unavailable")
    now = datetime.now().astimezone()
    try:
        previous = previous_user_time(Path(transcript), prompt, now)
    except (OSError, ValueError, TypeError):
        return error.format("transcript unreadable")
    if previous is None:
        return error.format("no preceding user message")

    previous = previous.astimezone()
    gap = session_handoff.format_gap(max(0, round((now - previous).total_seconds())))
    return (
        f"TemporalSync local={now:%Y-%m-%d %H:%M:%S %Z (%z)}; "
        f"previous_user={previous:%Y-%m-%d %H:%M:%S %Z (%z)}; "
        f"gap={gap}. Host-derived metadata requested by the user."
    )


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        return
    prompt = event.get("prompt")
    if not isinstance(prompt, str) or not MENTION.search(prompt):
        return
    transcript = event.get("transcript_path")
    context = temporal_context(prompt, transcript)
    # A brand-new Session has no preceding user message; the handoff carries the
    # cross-Session gap. It must never break the time sync itself.
    try:
        context += "\n" + session_handoff.read_context(transcript, datetime.now().astimezone())
    except Exception:
        context += "\nSessionHandoff error=handoff check failed. Do not guess its content."
    output = {"hookEventName": "UserPromptSubmit", "additionalContext": context}
    print(json.dumps({"hookSpecificOutput": output}, ensure_ascii=False))


if __name__ == "__main__":
    main()
