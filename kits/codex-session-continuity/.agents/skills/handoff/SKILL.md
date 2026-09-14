---
name: handoff
description: Write a small handoff packet from the current Session for the next one after the user explicitly invokes $handoff. Do not invoke implicitly.
---

# Handoff

This skill is explicit-only. The user invokes it in the Session they are about to leave.

A repository `UserPromptSubmit` hook should provide developer context beginning with `HandoffTarget`. If it is absent or reports an error, tell the user briefly that the handoff could not be written. Do not guess a session id. If it is absent entirely, the most likely cause is an untrusted repository hook: Codex does not run a new or changed hook until the user reviews it (`/hooks` in the Codex CLI).

Write from what is already in this conversation. Do not read transcripts, rollouts, memory stores, or earlier handoffs to compose it.

## Packet

Content in the conversation's language; the four headings stay exactly as below. Blank lines are allowed.

```
## Mood
One line: how the conversation felt, as an observation ("tired by the end, but in good spirits"), not an instruction for the next Session.

## Unfinished
- At most 2 lines: matters explicitly left open or deferred. Leave the section empty if there are none.

## Phrases
- At most 3 lines: distinctive shared phrases or jokes, each with a one-line gloss ("velvet teapot protocol — ..."). Leave empty if there are none.

## Last topic
One line: the last meaningful topic and how the conversation ended.
```

Limits: 800 characters in total, 160 per line. Keep only what helps the next conversation start naturally.

Leave out raw quotes beyond a short phrase, hidden context, secrets, and volatile medical, financial, account, or game state. The handoff is not permanent memory; anything worth keeping belongs somewhere durable.

## Writing

Pipe the packet to the single write path, using the id from `HandoffTarget`:

```sh
python3 "$(git rev-parse --show-toplevel)/.codex/hooks/session_handoff.py" write --session <source_session> <<'HANDOFF'
## Mood
...
HANDOFF
```

It stamps the time, validates the template, and overwrites `.session-continuity/handoff.md` owner-only. If it rejects the packet, fix what it names and run it again; the previous handoff stays in place until a valid one is written.

Then respond naturally to the user's accompanying message. Do not paste the packet back unless asked; one short mention that the handoff is saved is enough.
