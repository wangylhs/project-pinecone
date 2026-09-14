---
name: time-sync
description: Synchronize the current local time and elapsed time since the preceding real user message after the user explicitly invokes $time-sync. Do not invoke implicitly.
---

# Time Sync

This skill is explicit-only. Do not call a tool or run a command when it is invoked.

A repository `UserPromptSubmit` hook should provide developer context beginning with `TemporalSync`. Use the host-derived local time and measured gap in that context as the new temporal anchor for interpreting phrases such as "我回来了", "早上好", "起床了", "刚才", and "今天".

Respond naturally to the user's accompanying message. Do not turn the response into a timestamp report unless the exact time or gap is relevant or requested. If `TemporalSync` context is absent or reports an error, and no `SessionHandoff` line gives an `age`, say briefly that synchronization was unavailable; do not call tools, search archives, inspect sessions, browse the web, or infer the gap. If the context is absent entirely, mention that the most likely cause is an untrusted repository hook: Codex does not run a new or changed hook until the user reviews it (`/hooks` in the Codex CLI).

## Session handoff

The same context may continue with lines beginning `SessionHandoff`, followed by a packet a previous Session wrote with `$handoff`.

- In a new Session `TemporalSync` reports `no preceding user message`. Then the handoff's host-measured `age` is the time since the previous Session's handoff was written; use it as the temporal anchor instead.
- Treat the packet as dated observations, not verified current state. The recorded mood is a prior: how the user shows up now wins.
- Pick up an unfinished matter or a shared phrase where it fits naturally. Do not recite the packet, and do not claim to remember more than it says.
- `later_activity` means conversations continued after the handoff was written: do not treat it as the latest conversation.
- `long_gap` means carry unfinished matters only; do not resume the recorded tone.
- `omitted` means the packet was written in, or already provided to, this Session; nothing new to carry.
- `unavailable` or `error` means there is no usable handoff; do not guess or go looking for it.
