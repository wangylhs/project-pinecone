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
HOOK = ROOT / ".codex" / "hooks" / "time_sync.py"
PYTHON = sys.executable

AGENTS_ITEM = "# AGENTS.md instructions for /repo\n\n<INSTRUCTIONS>\nrules\n</INSTRUCTIONS>"
ENVIRONMENT_ITEM = "<environment_context>\n  <cwd>/repo</cwd>\n</environment_context>"
SKILL_ITEM = "<skill>\n<name>time-sync</name>\n</skill>"
PLUGINS_ITEM = "<recommended_plugins>\n- Airtable\n</recommended_plugins>"
ABORTED_ITEM = "<turn_aborted>\nThe user interrupted the previous turn.\n</turn_aborted>"
DESKTOP_LINK = "[$time-sync](/Users/me/repo/.agents/skills/time-sync/SKILL.md)"


def user_message(seconds_ago: float, *texts: str) -> dict:
    stamp = datetime.now(timezone.utc) - timedelta(seconds=seconds_ago)
    return {
        "timestamp": stamp.isoformat().replace("+00:00", "Z"),
        "type": "response_item",
        "payload": {
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": text} for text in texts],
        },
    }


class TimeSyncHookTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.transcript = Path(self._tmp.name) / "rollout.jsonl"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def run_hook(self, prompt: str, *records: dict) -> str:
        self.transcript.write_text(
            "".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records),
            encoding="utf-8",
        )
        event = {"prompt": prompt, "transcript_path": str(self.transcript)}
        # Keep any real handoff packet out of these time-only tests.
        handoff = Path(self._tmp.name) / "handoff.md"
        result = subprocess.run(
            [PYTHON, str(HOOK)],
            input=json.dumps(event, ensure_ascii=False),
            check=True,
            capture_output=True,
            text=True,
            env={**os.environ, "SESSION_HANDOFF_PATH": str(handoff)},
        )
        if not result.stdout.strip():
            return ""
        return json.loads(result.stdout)["hookSpecificOutput"]["additionalContext"]

    def test_cli_plain_mention_reports_gap(self) -> None:
        context = self.run_hook("$time-sync 我回来了", user_message(300, "晚点聊"))
        self.assertRegex(context, r"^TemporalSync local=.*; gap=5m( 1s)?\.")

    def test_desktop_markdown_link_mention_reports_gap(self) -> None:
        context = self.run_hook(f"{DESKTOP_LINK} 我回来了", user_message(300, "晚点聊"))
        self.assertRegex(context, r"^TemporalSync local=.*; gap=5m( 1s)?\.")

    def test_desktop_mention_after_text_reports_gap(self) -> None:
        context = self.run_hook(f"我回来了 {DESKTOP_LINK} \n", user_message(300, "晚点聊"))
        self.assertRegex(context, r"^TemporalSync local=.*; gap=5m( 1s)?\.")

    def test_non_mentions_do_nothing(self) -> None:
        for prompt in ("time-sync 我回来了", "$time-syncing", "试试 $time-sync-v2", "我回来了"):
            with self.subTest(prompt=prompt):
                self.assertEqual(self.run_hook(prompt, user_message(300, "晚点聊")), "")

    def test_first_turn_is_not_timed_against_injected_context(self) -> None:
        prompt = "$time-sync 测试一下"
        context = self.run_hook(
            prompt,
            user_message(1, AGENTS_ITEM, ENVIRONMENT_ITEM),
            user_message(0, prompt),
        )
        self.assertIn("no preceding user message", context)

    def test_injected_items_are_skipped_when_finding_previous_message(self) -> None:
        context = self.run_hook(
            f"{DESKTOP_LINK} 我回来了",
            user_message(600, "去买牛奶"),
            user_message(60, PLUGINS_ITEM),
            user_message(60, ENVIRONMENT_ITEM),
            user_message(30, ABORTED_ITEM),
            user_message(30, SKILL_ITEM),
        )
        self.assertRegex(context, r"; gap=10m( 1s)?\.")


if __name__ == "__main__":
    unittest.main()
