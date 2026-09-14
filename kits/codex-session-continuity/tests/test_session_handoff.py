from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
HOOKS = ROOT / ".codex" / "hooks"
TIME_SYNC = HOOKS / "time_sync.py"
HANDOFF = HOOKS / "session_handoff.py"
PYTHON = sys.executable

# Synthetic ids in the shape Codex puts at the end of a rollout filename.
PREVIOUS = "0a0a0a0a-0000-4000-8000-000000000001"
CURRENT = "0a0a0a0a-0000-4000-8000-000000000002"
OTHER = "0a0a0a0a-0000-4000-8000-000000000003"

AGENTS_ITEM = "# AGENTS.md instructions for /repo\n\n<INSTRUCTIONS>\nrules\n</INSTRUCTIONS>"
DESKTOP_LINK = "[$handoff](/Users/me/repo/.agents/skills/handoff/SKILL.md)"

# Aurora Ridge is the fictional expedition used across Project Pinecone.
PACKET = """## Mood
Tired after the ridge survey, but in good spirits

## Unfinished
- Recalibrate the snow gauge before the next storm

## Phrases
- velvet teapot protocol — the crew's name for boiling water twice at altitude

## Last topic
Where to pitch camp two; ended with good night
"""


def now() -> datetime:
    return datetime.now().astimezone()


def user_message(text: str) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "type": "response_item",
        "payload": {"type": "message", "role": "user", "content": [{"type": "input_text", "text": text}]},
    }


class SessionHandoffTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.handoff = self.tmp / "handoff.md"
        self.sessions = self.tmp / "sessions"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def run_script(self, script: Path, *args: str, stdin: str = "") -> subprocess.CompletedProcess:
        return subprocess.run(
            [PYTHON, str(script), *args],
            input=stdin,
            capture_output=True,
            text=True,
            env={**os.environ, "SESSION_HANDOFF_PATH": str(self.handoff)},
        )

    def hook(self, script: Path, prompt: str, transcript: Path) -> str:
        event = {"prompt": prompt, "transcript_path": str(transcript)}
        result = self.run_script(script, stdin=json.dumps(event, ensure_ascii=False))
        self.assertEqual(result.returncode, 0, result.stderr)
        if not result.stdout.strip():
            return ""
        return json.loads(result.stdout)["hookSpecificOutput"]["additionalContext"]

    def rollout(
        self,
        session: str,
        *records: dict,
        cwd: str = str(ROOT),
        source: object = "vscode",
        thread_source: str | None = "user",
        modified: datetime | None = None,
    ) -> Path:
        path = self.sessions / "2026" / "09" / "13" / f"rollout-2026-09-13T10-00-00-{session}.jsonl"
        path.parent.mkdir(parents=True, exist_ok=True)
        meta = {
            "type": "session_meta",
            "payload": {"id": session, "cwd": cwd, "source": source, "thread_source": thread_source},
        }
        path.write_text(
            "".join(json.dumps(record, ensure_ascii=False) + "\n" for record in (meta, *records)),
            encoding="utf-8",
        )
        if modified is not None:
            os.utime(path, (modified.timestamp(), modified.timestamp()))
        return path

    def place_handoff(self, written_at: datetime, session: str = PREVIOUS, body: str = PACKET) -> None:
        self.handoff.write_text(
            f"source_session: {session}\nwritten_at: {written_at.isoformat(timespec='seconds')}\n\n{body}",
            encoding="utf-8",
        )

    def time_sync(self, transcript: Path) -> str:
        return self.hook(TIME_SYNC, "$time-sync 我回来了", transcript)

    # Write path

    def test_write_stamps_header_and_is_owner_only(self) -> None:
        result = self.run_script(HANDOFF, "write", "--session", PREVIOUS, stdin=PACKET)
        self.assertEqual(result.returncode, 0, result.stderr)
        text = self.handoff.read_text(encoding="utf-8")
        self.assertRegex(text, rf"^source_session: {PREVIOUS}\nwritten_at: \d{{4}}-.*[+-]\d\d:\d\d\n\n## Mood\n")
        self.assertIn("velvet teapot protocol", text)
        self.assertEqual(self.handoff.stat().st_mode & 0o777, 0o600)

    def test_rejected_packet_leaves_previous_handoff(self) -> None:
        self.run_script(HANDOFF, "write", "--session", PREVIOUS, stdin=PACKET)
        before = self.handoff.read_text(encoding="utf-8")
        cases = {
            "too many phrases": PACKET.replace("## Last topic", "- a\n- b\n- c\n\n## Last topic"),
            "missing section": PACKET.split("## Last topic")[0],
            "unbulleted": PACKET.replace("- Recalibrate", "Recalibrate"),
            "text before sections": "你好\n" + PACKET,
            "long line": PACKET.replace("good spirits", "very " * 40),
            "over budget": PACKET.replace("## Unfinished", "## Unfinished\n- " + "很" * 150 + "\n- " + "很" * 150)
            .replace("## Phrases", "## Phrases\n- " + "很" * 150 + "\n- " + "很" * 150 + "\n- " + "很" * 150),
        }
        for name, body in cases.items():
            with self.subTest(name):
                result = self.run_script(HANDOFF, "write", "--session", PREVIOUS, stdin=body)
                self.assertEqual(result.returncode, 1)
                self.assertIn("previous handoff is unchanged", result.stderr)
                self.assertEqual(self.handoff.read_text(encoding="utf-8"), before)
        result = self.run_script(HANDOFF, "write", "--session", "not-a-session", stdin=PACKET)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(self.handoff.read_text(encoding="utf-8"), before)

    def test_dedicated_directory_ignores_itself(self) -> None:
        self.handoff = self.tmp / ".session-continuity" / "handoff.md"
        result = self.run_script(HANDOFF, "write", "--session", PREVIOUS, stdin=PACKET)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.handoff.parent / ".gitignore").read_text(encoding="utf-8"), "*\n")

    def test_other_directories_are_left_alone(self) -> None:
        result = self.run_script(HANDOFF, "write", "--session", PREVIOUS, stdin=PACKET)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse((self.handoff.parent / ".gitignore").exists())

    # $handoff hook

    def test_handoff_mention_reports_session_from_rollout_name(self) -> None:
        transcript = self.rollout(CURRENT)
        for prompt in ("$handoff 晚安", f"晚安 {DESKTOP_LINK}"):
            with self.subTest(prompt=prompt):
                self.assertTrue(
                    self.hook(HANDOFF, prompt, transcript).startswith(f"HandoffTarget source_session={CURRENT}.")
                )

    def test_handoff_without_rollout_id_refuses(self) -> None:
        transcript = self.tmp / "rollout.jsonl"
        transcript.write_text("", encoding="utf-8")
        self.assertIn("error=session id unavailable", self.hook(HANDOFF, "$handoff", transcript))

    def test_handoff_non_mentions_do_nothing(self) -> None:
        transcript = self.rollout(CURRENT)
        for prompt in ("handoff 晚安", "$handoffs", "试试 $handoff-v2", "晚安"):
            with self.subTest(prompt=prompt):
                self.assertEqual(self.hook(HANDOFF, prompt, transcript), "")

    # Reading on $time-sync

    def test_new_session_gets_packet_and_cross_session_gap(self) -> None:
        self.run_script(HANDOFF, "write", "--session", PREVIOUS, stdin=PACKET)
        self.rollout(PREVIOUS)  # the goodbye right after $handoff stays within the grace window
        transcript = self.rollout(CURRENT, user_message(AGENTS_ITEM))
        context = self.time_sync(transcript)
        self.assertIn("TemporalSync error=no preceding user message", context)
        self.assertRegex(context, rf"SessionHandoff source_session={PREVIOUS}; written_at=.*; age=\d+s\.")
        self.assertIn("velvet teapot protocol — the crew's name for boiling water twice at altitude", context)
        self.assertNotIn("later_activity", context)
        self.assertNotIn("long_gap", context)

    def test_handoff_written_in_this_session_is_omitted(self) -> None:
        self.place_handoff(now() - timedelta(minutes=5), session=CURRENT)
        context = self.time_sync(self.rollout(CURRENT, user_message("晚点聊")))
        self.assertIn("SessionHandoff omitted: it was written in this Session.", context)
        self.assertNotIn("velvet teapot protocol", context)

    def test_packet_is_injected_once_per_session(self) -> None:
        self.place_handoff(now() - timedelta(hours=8))
        transcript = self.rollout(CURRENT)
        first = self.time_sync(transcript)
        self.assertIn("velvet teapot protocol", first)
        developer = {
            "type": "response_item",
            "payload": {"type": "message", "role": "developer", "content": [{"type": "input_text", "text": first}]},
        }
        with transcript.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(developer, ensure_ascii=False) + "\n")
        second = self.time_sync(transcript)
        self.assertIn("SessionHandoff omitted: already provided earlier in this Session.", second)
        self.assertNotIn("velvet teapot protocol", second)

    def test_missing_or_invalid_handoff_carries_nothing(self) -> None:
        transcript = self.rollout(CURRENT)
        self.assertIn("SessionHandoff unavailable", self.time_sync(transcript))
        self.place_handoff(now() - timedelta(hours=8), body=PACKET.split("## Last topic")[0])
        context = self.time_sync(transcript)
        self.assertIn("SessionHandoff error=sections must be exactly", context)
        self.assertNotIn("velvet teapot protocol", context)

    def test_later_conversation_in_this_repository_is_flagged(self) -> None:
        written = now() - timedelta(hours=2)
        self.place_handoff(written)
        self.rollout(OTHER, modified=written + timedelta(hours=1))
        context = self.time_sync(self.rollout(CURRENT))
        self.assertIn("SessionHandoff later_activity=", context)
        self.assertIn("velvet teapot protocol", context)

    def test_source_session_continuing_past_grace_is_flagged(self) -> None:
        written = now() - timedelta(hours=2)
        self.place_handoff(written)
        self.rollout(PREVIOUS, modified=written + timedelta(minutes=30))
        self.assertIn("later_activity", self.time_sync(self.rollout(CURRENT)))

    def test_unrelated_threads_are_not_flagged(self) -> None:
        written = now() - timedelta(hours=2)
        later = written + timedelta(hours=1)
        cases = {
            "other repository": dict(session=OTHER, cwd="/Users/me/elsewhere", modified=later),
            "guardian reviewer": dict(
                session=OTHER, source={"subagent": {"other": "guardian"}}, thread_source="guardian_review", modified=later
            ),
            "agent-created thread": dict(session=OTHER, thread_source="agent_created_thread", modified=later),
            "goodbye within grace": dict(session=PREVIOUS, modified=written + timedelta(minutes=5)),
        }
        for name, case in cases.items():
            with self.subTest(name):
                for stale in self.sessions.glob("*/*/*/*.jsonl"):
                    stale.unlink()
                self.place_handoff(written)
                session = case.pop("session")
                self.rollout(session, **case)
                self.assertNotIn("later_activity", self.time_sync(self.rollout(CURRENT)))

    def test_long_gap_drops_recorded_tone(self) -> None:
        self.place_handoff(now() - timedelta(days=8))
        context = self.time_sync(self.rollout(CURRENT))
        self.assertIn("SessionHandoff long_gap", context)
        self.assertRegex(context, r"age=8d")

    def test_largest_context_fits_hook_limit(self) -> None:
        line = "很" * 100
        body = (
            f"## Mood\n{line}\n\n## Unfinished\n- {line}\n- {line}\n\n"
            f"## Phrases\n- {line}\n- {line}\n- {line}\n\n## Last topic\n{line}\n"
        )
        written = now() - timedelta(days=8)
        self.place_handoff(written, body=body)
        self.rollout(OTHER, modified=written + timedelta(days=1))
        context = self.time_sync(self.rollout(CURRENT, user_message("晚点聊")))
        self.assertNotIn("error", context)
        self.assertIn("later_activity", context)
        self.assertIn("long_gap", context)

        hooks = json.loads((ROOT / ".codex" / "hooks.json").read_text(encoding="utf-8"))
        limit = next(
            hook["additionalContextLimit"]
            for group in hooks["hooks"]["UserPromptSubmit"]
            for hook in group["hooks"]
            if hook["command"].endswith('time_sync.py"')
        )
        # The limit's unit is undocumented; UTF-8 bytes is the strictest reading.
        self.assertLessEqual(len(context.encode("utf-8")), limit)


if __name__ == "__main__":
    unittest.main()
