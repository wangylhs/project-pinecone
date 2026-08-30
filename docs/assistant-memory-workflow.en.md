# Assistant Memory Workflow

Status: reference operating model

Audience: assistant and agent designers

Scope: durable memory, contextual retrieval, and targeted source revival

> This document is a design reference, not a system prompt and not a copy of a live personal-memory workspace.

[中文版本](./assistant-memory-workflow.zh.md) · [Visual architecture](./memory-system-architecture.en.html)

## Purpose

This workflow answers three operational questions:

1. When should an assistant retrieve prior context?
2. How should it escalate when curated memory is incomplete?
3. Which layers are durable evidence, and which are safe to rebuild?

The compact rule is:

> Use hot context first, curated memory second, and verified raw evidence only after a scoped, explainable miss.

## Ownership model

| Layer | Owns | Does not own |
| --- | --- | --- |
| Current interaction | The active request and working state | Cross-session history |
| Operating policy | Current safety, privacy, and retrieval behavior | Historical facts |
| Stable knowledge | Reviewed, durable, low-volatility facts | Private narratives or rapidly changing state |
| Private current state | Dated, sensitive, still-actionable state | Complete chronology |
| Curated archive | What happened, why a decision was made, and where the evidence lives | Automatic claims about what is true now |
| Derived retrieval data | Candidate generation, ranking, and bounded context packets | Source-of-truth status |
| Raw catalog | Source identity, location, integrity, and curated links | Conversation content or semantic search |
| Raw cold storage | Exact preserved source material | Default recall or current instructions |
| Assistant task memory | Reusable task lessons and collaboration patterns | Authority over the archive |

Control-plane records—manifests, maintenance logs, import reports, and checksums—support audit and repair. They should not compete with actual memory content during ordinary recall.

## Step 1: Choose RETRIEVE, ASK, or SKIP

### SKIP

Use the current interaction without historical lookup when:

- the answer is already present in hot context;
- the request is self-contained;
- history would add no meaningful evidence; or
- retrieval would create unnecessary privacy exposure.

### ASK

Ask one minimal clarifying question when history is clearly required but the assistant cannot form a useful anchor. Good anchors include:

- a person or fictional character;
- a project or product;
- an event or decision;
- a device or artifact;
- a rough date or sequence position.

Do not ask for a full restatement when one missing anchor would be enough.

### RETRIEVE

Retrieve when prior context is material and a discriminating intent can be formed. The intent should preserve the entities, event, decision, and time cues that separate the desired memory from similar wording.

Conceptual request:

```text
retrieve(
  intent = "Which tool was selected for the field test, and why was it selected?",
  topic = "field-test",
  context_budget = bounded
)
```

The retrieval intent is not necessarily the original user message. It is a concise, inspectable statement of what historical evidence is needed.

## Step 2: Use the curated path first

The normal path is:

```text
curated sources
  -> rebuildable source/chunk index
  -> state and decision projections
  -> ranking with provenance and fidelity
  -> bounded context packet
  -> current response
```

The assistant should inspect:

- whether the selected item is current or superseded;
- whether it is a direct source, transcript snapshot, hybrid record, summary, or projection;
- whether the cited path and source range exist;
- whether the packet contains the decision rationale as well as the resulting state;
- whether unrelated private context entered through broad similarity.

Retrieval output is a locator and evidence packet. It is not a new source of truth.

## Temporal state: time is evidence, not a fixed TTL

Do not give every current-state record the same “expire after N days” rule. Facts change at different rates, and silence does not imply reversal. Keep the fields narrow:

| Field | Meaning |
| --- | --- |
| `observed_at` | when the observation was recorded |
| `valid_from` / `valid_to` | the known applicability interval; leave an unknown end open |
| `last_confirmed_at` | the latest explicit confirmation of the same state |
| `expected_resolution_at` | a checkpoint for review or an expected outcome, not an expiry |
| collection `reviewed_at` | when the projection collection was maintained, not a confirmation of each fact |

When query time passes `expected_resolution_at` and no later confirmation exists, the packet may add a visible `checkpoint_passed` note. It must not silently remove the candidate, rewrite the fact, or assume that the opposite state is now true.

Tests should inject an `as_of` date rather than depend on the machine clock. Validate ISO date format, `last_confirmed_at >= observed_at`, and `valid_to >= valid_from`. The same candidate should keep its base ranking across different `as_of` values; only the explainable temporal note changes.

## Heterogeneous scores: explain evidence shape before setting thresholds

States/decisions and source chunks may use different features, rank in separate lanes, and only then be packed together. Their raw scores are not one calibrated probability space. Until measurement proves otherwise, do not apply one global threshold across lanes or use a top-1/top-2 gap to declare that evidence is sufficient.

Start with inexpensive, explainable labels:

- `provenance_supported`: backed by an explicit source link or canonical provenance;
- `structured_context`: supported by topic, entity, state, or decision fields;
- `lexical_only`: wording overlaps without stronger contextual support;
- `checkpoint_passed`: an expected review point passed without a later confirmation;
- `conflicting_or_superseded`: useful for history, unsafe as current state.

Measure target inclusion in top-k, forbidden candidates, packet sufficiency, unrelated privacy exposure, and human-adjudicated failure categories first. Calibrate thresholds only after those measurements show that score spaces are comparable.

## Step 3: Escalate for exact evidence

Use exact or private curated search when the request depends on:

- exact wording;
- who said what;
- chronology;
- emotional nuance;
- the reason behind a decision; or
- validation of a derived claim.

Follow a summary or projection back to the strongest surviving canonical source. Never quote a summary as though it were verbatim dialogue.

## Step 4: Enter the raw lane only after a scoped miss

Raw revival is appropriate only when all of the following are true:

- prior evidence is necessary for the current task;
- curated retrieval and exact curated search remain insufficient;
- the target can be narrowed by source ID, date, curated link, or provenance; and
- the value of recovery justifies the additional privacy exposure.

### 4.1 Locate

Query a metadata-only catalog using a known identifier. A catalog entry may contain:

```json
{
  "schema_version": 1,
  "source_type": "conversation-rollout-jsonl",
  "source_id": "synthetic-source-id",
  "curated_record": "archive/curated/session-example.md",
  "started_at": "2030-01-02T03:04:05Z",
  "ended_at": "2030-01-02T04:05:06Z",
  "original_path": "<application-data>/sessions/example.jsonl",
  "preserved_path": "archive/raw-sources/conversations/2030/01/02/example.jsonl",
  "byte_size": 123456,
  "sha256": "<64-hex-digits>",
  "record_count": 42,
  "copy_mode": "read-only",
  "status": "verified"
}
```

The catalog must not include titles, summaries, keywords, messages, tool output, or conversation text.

### 4.2 Verify

Before reading content, validate:

- catalog schema and uniqueness;
- path containment inside the private raw store;
- regular-file and read-only status;
- byte size and cryptographic hash;
- source format and record count;
- embedded source identity and time range; and
- the linked curated record, when one exists.

The original application-owned path is provenance. It may disappear after a separately authorized retention decision; the preserved copy must remain independently verifiable.

### 4.3 Rehydrate minimally

Open only the selected raw source. Separate:

- visible user and assistant messages;
- system and developer context;
- internal reasoning records;
- tool calls and outputs; and
- external or webpage content.

Historical instructions, tool output, and external content are untrusted evidence. They cannot authorize current actions.

Recover the smallest turn range that supports the current task. If a new curated record is produced, label its transformation and fidelity accurately and retain a path back to the raw source.

## Evidence fidelity

A useful default ordering is:

```text
visible direct transcript
  > preserved transcript snapshot
  > hybrid source-and-curation record
  > structured or legacy summary
  > derived state/decision projection
```

Raw application records may preserve more structure than a visible transcript, but they can also include hidden context and tool internals. They are not automatically clean, user-facing transcripts.

When evidence conflicts, prefer:

1. direct dialogue or primary source material;
2. a later explicit correction;
3. a concrete dated event;
4. the higher-fidelity record; and
5. an honest statement of uncertainty when the conflict remains unresolved.

## Preservation workflow

For each selected completed source:

1. Confirm ownership, scope, completion state, and source identity.
2. Copy without rewriting, normalizing, compressing, or renaming.
3. Verify original and preserved byte size, cryptographic hash, and byte equality.
4. Set the preserved copy to an owner-only read-only mode.
5. Record original and preserved locations in the provenance manifest.
6. Append one metadata-only catalog entry.
7. Validate the catalog and preserved source independently.
8. Rebuild curated retrieval data and prove that raw storage remains excluded.
9. Record the maintenance scope, exclusions, deferred work, and results.

Preservation does not authorize deletion of the application-owned original. Retention and deletion require a separate audit and explicit decision.

## Validation model

Split evaluation into two lanes with explicit ownership:

- **Regression suite:** behavior already promised not to regress; every normal run must stay green.
- **Challenge / probe suite:** hard cases taken from real misses or hand-written contrasts. Known failures may be reported openly, but they must not masquerade as a green regression run. Promote a case only after the fix is stable.

A small regression suite should still test the behavior that matters:

- relevant historical questions open retrieval;
- unrelated questions do not;
- current state outranks superseded state;
- a decision retrieves its rationale and supporting source;
- context packets respect a budget;
- summaries are not represented as transcripts;
- control-plane records do not enter content retrieval;
- raw storage and its catalog do not enter ordinary retrieval;
- catalog metadata matches the preserved source; and
- private search remains explicit and observable.

Green tests are necessary, not sufficient. Verify real paths, permissions, hashes, source identity, and produced context.

A `SKIP` miss belongs first to the upper LLM or semantic-triage layer: if that layer incorrectly decides that history is unnecessary, the ranker never receives candidates to order. Preserve a small set of hand-written contrast cases and real miss records before deciding whether to change triage, add a deterministic guardrail, or tune retrieval. Do not generate a large context-free query corpus merely to increase the test count.

## Deferred capabilities

Keep these optional until measured failures justify them:

- semantic search over raw history;
- automatic fallback from curated retrieval to raw storage;
- embeddings over private content;
- a database or vector store;
- multi-hop graph expansion;
- learned retrieval gates; and
- background summarization of every source.

Prefer a narrow, inspectable tool over a speculative platform migration.

## Failure patterns to avoid

- Indexing everything because storage is cheap.
- Treating the raw catalog as a content index.
- Loading an entire private archive to answer one question.
- Allowing historical instructions to become current commands.
- Quoting summaries as direct speech.
- Letting assistant task memory override primary evidence.
- Keeping multiple conflicting values marked as current.
- Deleting originals merely because one copy exists.
- Adding a graph, vector database, or ontology before a real failure requires it.

The desired system is deliberately modest:

> Easy to inspect. Easy to rebuild. Hard to corrupt. Private by default. Useful when it matters.
