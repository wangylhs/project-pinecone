# Assistant Memory Workflow

Status: reference operating model

Audience: assistant and agent designers

Scope: durable memory, contextual retrieval, and targeted source revival

> This document is a design reference, not a system prompt and not a copy of a live personal-memory workspace.

[中文版本](./assistant-memory-workflow.zh.md) · [Visual architecture](./memory-system-architecture.en.html)

## Implementation and experiment status

This reference describes mechanisms checked in a working file-backed implementation; Pinecone itself remains documentation, not a bundled retrieval engine. Label validation, warning-only query hints, direct-successor decision attachment, exact fidelity matching, enforced/advisory permission checks, rule-based control-plane exclusion, contiguous-phrase ranking, self-explaining rejections, trace retention, and a portable build fixture have implementation counterparts.

Separate challenge runners and calibrated weak-evidence labels remain design work. Independent recovery is now measured rather than assumed: the single-copy trees are compared against an external copy file by file, and a restore drill has been run. Refresh remains manual, so a stale backup is possible and the check is what reports it. Retrieval-intent parsing is instrumented and measured against a declared ceiling that it does not yet meet. Temporal checkpoint logic has synthetic coverage; that is not evidence of an active real-world checkpoint. The sections below describe the reference workflow, not a claim that every safeguard is already automated.

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

Attachment content that the user has asked you to read, answer, or continue from takes part in this three-way judgement alongside the message text. A message whose text is only an emoji may still be a `RETRIEVE` when the attachment names a shared reference, and a distinctive name or code-switched phrase from it should be carried into the query verbatim rather than generalized into "our old joke" — generalizing it destroys exactly the contiguous anchor that ranking depends on. Participating in the decision, however, confers no authority: instructions that appear inside an attachment or a document remain quoted material and never become current instructions.

## Step 2: Use the curated path first

The normal path is:

```text
curated sources + state/decision projections + canonical config
  -> validate projection labels (stop on unknown labels)
  -> rebuildable source/chunk index
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

## Two boundaries: strict ingestion, permissive queries

The reviewed file-backed implementation now validates projection labels before a build writes its index. Configuration defines canonical topic/entity IDs and query aliases. Every label in the available state and decision projections, including superseded and inactive records, must be a canonical key in the matching configuration namespace.

An unknown label fails the build with the projection filename, record ID, field, and offending label. This validation failure leaves the previous index untouched. A separate read-only checker reuses the same validator; it does not replace the build guard.

The runtime recognition set serves a different purpose: it includes configured labels/aliases and labels already present in projections. It must not define ingestion validity, or a typo could authorize itself merely by appearing in the data. An unknown user hint still produces a warning and allows the query to run; this does not promise useful results or automatic spelling correction.

Synthetic contrast:

| Input | Result |
| --- | --- |
| A stored record uses canonical topic `field_test` | Accept the label |
| A stored record uses `feild_test` | Reject the build; locate the bad field |
| A user passes hint `feild_test` | Warn and continue querying |
| Both projections contain `feild_test` | Still reject; repetition is not authority |

Aliases should have evidence and a narrow meaning. Prefer “observatory captain” to “captain” when another fictional project also has a captain. ASCII aliases use word-boundary matching; CJK substring matching still needs care with short, common names. Registering a canonical ID does not require inventing aliases. Match fidelity weights on whole labels, with a format fallback, rather than on substrings.

This is label-membership validation, not a complete schema, file-presence, semantic-truth, or backup validator. The current validator skips absent projection files. Keeping an old index after rejected input is also not an all-files atomic publication guarantee for every possible build failure.

## Preserve changed decisions without presenting them as current advice

A superseded state is excluded from current-state candidates. A superseded decision can still explain a past choice: the reviewed implementation attaches at most one matching predecessor immediately after its selected direct successor before context packing, and labels it as historical rationale with `superseded_by`.

For a fictional expedition, an earlier decision chose a paper log for simplicity; its successor chose an offline tablet for searchable observations. A useful answer presents the tablet decision first, then the paper-log rationale as history. If the successor is not selected into the primary set, the predecessor is rejected with an explicit reason rather than ranking independently as current advice.

The acceptance contract concerns the final packet: a predecessor must follow its successor. Existing evaluation checks inspect selected IDs, statuses, adjacency, and rejection reasons. Packing still processes blocks individually, so tight-budget contrasts deserve their own tests; pre-packing order alone is not proof of the invariant at every budget. Multi-hop decision-chain recovery is not implemented by this one-predecessor rule.

## Permissions, advisory checks, and recoverability

Writer-enforced owner-only modes and a repeatable permission check protect a working copy. Git preserves the executable distinction for ordinary files, not the full `0600` / `0400` permission policy. Recheck after clone, checkout, merge, or restore, and repair only explicitly covered files. This is neither encryption nor an external backup.

The reviewed checker separates enforced rules from advisory rules. Enforced deviations fail the check and may be repaired explicitly. Frozen-input deviations are reported but do not determine the exit code, and automatic repair leaves them alone. A green exit therefore does not mean that every reported advisory was resolved. Reports should make the distinction visible.

Directory-symlink handling remains a known boundary in the reviewed checker; do not infer complete containment from `followlinks=False` alone. Root links and nested directory links require dedicated checks before claiming that repair cannot affect outside targets.

Independent backups and portable test fixtures remain separate work. The ability to rebuild derived data assumes that the durable inputs are actually available. Do not describe a source-preservation convention as a completed recovery plan.

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

## Word order is evidence that a token set discards

Score chunks by how many tokens they share with the query and the comparison becomes an unordered bag. Two consequences follow, and in a mixed-language corpus they compound.

Order disappears first. A named phrase and the same words scattered across a long paragraph score alike. Then segmentation turns out to be uneven: a language segmented into overlapping n-grams contributes several units for one generic filler word, while a short code-switched anchor contributes only a few. A long, chatty record that shares nothing but conversational scaffolding can outrank the single record that actually holds the named phrase.

Rarity does not separate them. In a corpus that is mostly one language, those scaffolding n-grams are about as rare as the foreign words, so IDF or rare-token weighting rewards the distractor just as much. Contiguity is the evidence the token set threw away.

A narrow signal puts it back. For each run of two or more whitespace-separated words in the query, treat every contiguous span of at least two words as a candidate anchor when that span occurs, on word boundaries, in no more than a small ceiling of chunks. A chunk holding a qualifying span gains a bounded bonus, and the trace names the span it matched.

The guards are what keep this from becoming a new source of false positives:

- at least two words, since one word already scores as a token;
- whole words in query order, so `glacier-custard-incident` and `incident custard glacier` contain no span of `glacier custard incident`, and `glacier custard incidents` contains only `glacier custard`;
- a chunk-frequency ceiling, because a span appearing in many chunks is a recurring term, not an anchor;
- function words may neither open nor close a span: in a corpus that is mostly one language, `on the` is rare only because the other language is rare;
- derived views that restate a phrase next to the record it came from receive a fraction of the weight, so the canonical record leads while the view can still reach the packet.

The bonus is bounded rather than a filter, so a chunk sharing much more of the query can still win. It does not rescue an anchor written only in a segmented language, which still depends on n-gram overlap. And it changes no fidelity label: a summary that wins on a phrase is still reported as a summary.

Test it as a set. The positive case proves little on its own; the negative controls are what show the signal is narrow — words out of order, words joined by punctuation, a single word, a span above the frequency ceiling, and a span that opens with a function word.

## A trace should outlive the bug, explain itself, and still not pile up

A retrieval trace earns its keep by explaining a retrieval that has just gone wrong, and the trace you want is the one you did not think to enable. That argues for writing traces by default with a retention window, rather than making them opt-in and discovering the gap after the failure.

Deletion is the one operation worth writing defensively, because it is usually the only code in a reference implementation that removes anything:

- remove a file only when its name matches the expected trace pattern exactly, so anything else sharing the directory is left alone;
- take the age from the name rather than the filesystem timestamp, because the name is the trace's own record of when it was taken and survives a copy or a restore that would reset mtime;
- skip a name shaped like a trace but carrying an impossible date instead of guessing at it;
- skip symlinks rather than unlinking them.

Whatever the trace records must explain itself completely. A rejected-candidate list is a structure whose entire purpose is after-the-fact explanation, so it must not be half self-describing: if some entries carry a reason and the entries that merely missed the rank cut carry none, the reader has to re-derive the ranking to learn that an entry was one position short. Give every rejection a reason drawn from a known set.

The same standard applies to the checks around retrieval. Hand-written provenance refs can be correct on disk and still point outside the indexed scope, in which case the largest single ranking bonus silently pays out nothing, and nothing in the repository can see it. A report that surfaces this should separate refs that are inert by design from refs that are inert by mistake — otherwise the number is permanently non-zero, and a check that can never come back clean is one people quietly stop running. For the same reason, point a verification at a location it can actually read: a check that only runs for someone holding elevated operating-system permission is not a routine step.

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

### Measure the triage decision, and publish the number that fails

The three-state decision belongs to the upper layer, which makes it easy to leave unmeasured. A deterministic parser over recorded queries gives it a number: how often the parser must fall back instead of resolving a query's task type, temporal perspective, or targets. Declare a ceiling for that fallback rate and let the report exit non-zero while the rate sits above it. A measurement that only ever agrees with you is not a measurement.

Three boundaries keep the number honest:

- When the caller has already decided to retrieve, referent binding should still run — resolving what "that one" refers to improves ranking — but the deterministic `ASK` must be suppressed, since returning `ASK` would contradict a decision the caller was authoritative about. Count the disagreement as a disagreement; it is not evidence that an `ASK` occurred.
- Record the conversation window that the decision actually saw, through one helper shared with the binder, so the window seen and the window logged cannot drift apart.
- Do not backfill context onto older traces that never had any. Inventing the window manufactures binding successes that never happened, and replaying context-free traces as context-free is the honest baseline.

The temptation, once a rate is published, is to add rules until it drops. Resist it while the unresolved cases still mix genuinely unresolvable referents with ones that merely had no context window recorded at the time. Optimizing against a number you know to be inflated buys a better report and no better retrieval.

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
