# Codex Session Continuity Kit

[中文](./README.zh.md) · [Web page](https://wangylhs.github.io/project-pinecone/docs/session-continuity.en.html) · [Why it is built this way](../../docs/assistant-memory-workflow.en.md#before-retrieval-re-anchor-time-and-warm-context)

An agent has no sense of elapsed time, and a new Session starts cold. Come back after a night away, say "good morning", and the agent answers as if a minute had passed. Open a new Session, and the running joke, the mood, and the thing you both meant to finish tomorrow are gone until you retell them.

This kit adds two explicit commands to [Codex](https://github.com/openai/codex):

| Command | When | What the agent gets |
| --- | --- | --- |
| `$time-sync` | when you come back | local time and the host-measured gap since your previous message |
| `$handoff` | before you leave a Session | nothing yet: it writes a small packet for the next Session |

The two layers cover each other's blind spot. Inside one Session, the gap comes from the transcript. A brand-new Session has no previous message, so `$time-sync` carries the last handoff across instead, together with how long ago it was written.

Nothing runs unless you type a command. There is no database, no background process, and no dependency beyond Python 3.9+.

## What the agent sees

The first `$time-sync` in a new Session, with a handoff left the night before:

```text
TemporalSync error=no preceding user message. Do not infer elapsed time.
SessionHandoff source_session=0a0a0a0a-0000-4000-8000-000000000001; written_at=2030-01-02T22:41:07+01:00; age=9h 12m. Host-read packet from a previous Session's $handoff: recorded observations, not verified current state.
## Mood
Tired after the ridge survey, but in good spirits

## Unfinished
- Recalibrate the snow gauge before the next storm

## Phrases
- velvet teapot protocol — the crew's name for boiling water twice at altitude

## Last topic
Where to pitch camp two; ended with good night
```

The skill tells the agent to treat this as dated observations, pick things up where they fit, and not recite the packet. Later in the same Session, `$time-sync` costs two short lines: `TemporalSync local=…; previous_user=…; gap=…` and `SessionHandoff omitted: already provided earlier in this Session.`

## Install

1. Copy `.codex/` and `.agents/` from this directory into the root of your Git repository. If you already have `.codex/hooks.json`, merge the two `UserPromptSubmit` handlers into it.
2. **Trust the hooks.** Codex does not run a new or changed hook until you review it, and an untrusted hook fails silently: the agent only notices that the context is missing. Open the Codex CLI in the repository and accept the *Hooks need review* prompt, or run `/hooks`. Do this again after any edit to `hooks.json` — changing even `additionalContextLimit` resets trust.
3. Open a new Session, so the skills are picked up.

The packet is written to `.session-continuity/handoff.md`. That directory creates its own `.gitignore` on first write, so the notes cannot be committed by accident. Set `SESSION_HANDOFF_PATH` to put it somewhere else.

To run the tests, from this directory:

```sh
python3 -m unittest discover -s tests
```

## Use

- Leaving: `$handoff good night`. The agent writes the packet through a single validated command and says it is saved.
- Coming back: `$time-sync good morning`, as the first message of the new Session, or at any point inside a Session.

## Every state is explicit

Silence means a hook did not run, so every other outcome says what happened:

| Line | Meaning |
| --- | --- |
| `TemporalSync local=…; gap=…` | measured gap since your previous message in this Session |
| `TemporalSync error=no preceding user message` | a new Session; use the handoff's `age` instead |
| `SessionHandoff source_session=…; age=…` | the packet follows |
| `SessionHandoff later_activity=…` | Codex conversations in this repository continued after the handoff was written |
| `SessionHandoff long_gap` | older than 7 days: carry unfinished matters, not the recorded tone |
| `SessionHandoff omitted: …` | written in this Session, or already provided earlier in it |
| `SessionHandoff unavailable` / `error=…` | nothing usable; the agent must not guess |
| `HandoffTarget source_session=…` | the id the agent writes the packet under |

## How it is built

- **The host measures, the agent never infers.** Elapsed time comes from transcript timestamps. If measurement fails, the agent says so instead of estimating.
- **Skip what the host injected.** The "previous user message" must ignore user-role items the client adds itself: instructions, environment context, skill payloads, interrupted-turn markers. Otherwise the first turn always measures a gap of zero.
- **Both mention formats.** The CLI sends `$time-sync` as plain text; the Desktop app sends a Markdown link. Both match.
- **The model writes, the host identifies.** Only the model can summarize; only the host knows the Session id. A small hook supplies the id, and one write command validates the fixed template before it overwrites, so a rejected packet never replaces a good one.
- **One copy, overwritten.** Not versioned, not indexed, not an archive. It is warm context, so it can never grow into a second memory.
- **Mood is an observation, not an instruction.** The user's mood in the new Session wins, and after a long gap the old tone is dropped.
- **The previous rollout is not the previous conversation.** Codex's session directory mixes other repositories, subagents, and reviewer threads. Only user threads whose working directory is this repository count, and the kit reports later activity rather than claiming there was none. The source Session gets a 10-minute grace for the goodbye after `$handoff`.
- **Once per Session.** The packet is injected on the first `$time-sync` of a Session; later calls cost one line.
- **Budgeted.** At most 800 characters of packet and 160 per line. The worst case stays under the hook's 4000 limit even counted as UTF-8 bytes, because Codex does not document the unit.

## Limits

- Codex-specific. It relies on the hook event's `transcript_path`, rollout filenames ending in the Session id, and the `cwd` and `thread_source` fields of `session_meta`. Built against Codex 0.154 (CLI and Desktop) on macOS; other versions and platforms are untested.
- The repository must be a Git repository; the hook commands resolve paths with `git rev-parse`.
- `later_activity` compares rollout modification times, so it can flag unrelated work done in the same repository. It says the handoff *may* not cover it, nothing stronger.
- A handoff holds one Session's warm context. It is not a substitute for durable memory, and it makes no claim about what is true now.
- The mechanism carries over to other agent hosts; the transcript parsing and hook contract do not. It has not been ported.
