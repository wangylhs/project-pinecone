# Project Pinecone: Memory Experiment Garden

> Working draft. This is a place to preserve ideas, not a committed roadmap.

Project Pinecone may grow into a small, inspectable garden for experiments in
durable memory, contextual retrieval, and explainable recall.

Its purpose is not to store the private memories that inspired the project.
Instead, it should extract reusable methods from that experience and test them
with synthetic characters, events, and histories.

## Core idea

A useful memory system is not the one that stores the most. It is the one that
can recover the right context at the right time, explain why that context is
relevant, and preserve a path back to durable source material.

Raw experiences and provenance should remain durable. Derived structures such
as indexes, chunks, state projections, relationships, embeddings, rankings, and
caches should be replaceable and rebuildable.

## Garden beds

### 1. Principles

- durable source material versus rebuildable derived data
- current state versus decision history
- provenance and explainable recall
- relevance, privacy, and context budgets
- narrow, inspectable layers that can be replaced independently

### 2. Schemas and templates

Small examples for concepts such as:

- sources and chunks
- current states and decisions
- topics, entities, and relationships
- retrieval plans and context packets
- observable retrieval traces

Templates are one part of the garden, not the identity of the whole project.

### 3. Synthetic examples

Use entirely fictional characters and events to demonstrate behavior. A sample
history might include a character choosing a tool, later changing that choice,
and eventually asking, "Why did we choose this?"

The example should show how the system finds the current state, recovers the
decision and its rationale, and follows provenance back to the source.

### 4. Experiments and evaluations

Keep small, readable cases for questions such as:

- When should the system retrieve history?
- When should it ask a clarifying question?
- When should it answer without retrieval?
- How should relevance decay across related topics or entities?
- How can a result explain why it was recalled?
- How do we detect stale, conflicting, or overly broad context?

A tiny reference implementation may grow here later, but only when an
experiment needs it.

## First candidate evaluation: similar wording, different context

Use a fictional character with two memories that have similar linguistic
shapes but different meanings:

```text
Memory A: "Lately I have not felt like playing games."
Memory B: "I do not like drinking milk."
Query:    "Why have I not felt like gaming recently?"
```

An embedding search may retrieve both memories because they describe a negative
preference and use similar wording. The retrieval pipeline should keep Memory A
as relevant and reject Memory B after considering structured context:

- Memory A belongs to the gaming topic, describes a possibly temporary recent
  state, and may be connected to workload or fatigue.
- Memory B belongs to the food topic and describes a stable dietary preference
  or constraint.

This case tests the distinction between **semantic similarity** and **contextual
relevance**. Vector similarity should broaden recall; structured metadata and
reranking should restore the boundary.

### Test classification

The same scenario can be used at more than one test level:

- **Unit test:** provide two already-retrieved candidates to an isolated filter
  or reranker and assert that the gaming memory ranks above or excludes the
  milk memory.
- **Integration or retrieval evaluation:** send the natural-language query
  through embedding, candidate retrieval, metadata filtering, and reranking,
  then inspect the final context packet.
- **Regression test:** after this failure mode has been observed or deliberately
  accepted as behavior that must not change, preserve either test above as a
  permanent guard against its return.

"Unit" and "integration" describe the scope of a test. "Regression" describes
why the test is retained, so a test can be both a unit test and a regression
test.

## Second candidate evaluation: time-aware state without TTL

Use a fictional state that was observed on one date, explicitly confirmed on a
later date, and expected to reach a review checkpoint after that:

```text
observed_at:            2030-01-02
valid_from:             2030-01-02
valid_to:               null
last_confirmed_at:      2030-01-05
expected_resolution_at: 2030-01-10
```

The state must not disappear merely because a fixed number of days elapsed.
`expected_resolution_at` is a checkpoint, not an expiry date. If an injected
`as_of` date is after the checkpoint and no later confirmation exists, the
retriever may attach a visible review note without changing the candidate's
base ranking.

The field meanings stay narrow:

- `observed_at`: when the observation was captured;
- `valid_from` / `valid_to`: the known applicability interval, when one exists;
- `last_confirmed_at`: the latest explicit confirmation of the same state;
- `expected_resolution_at`: when a follow-up is expected, not when truth ends;
- dataset-level `reviewed_at`: when the projection collection was maintained,
  not a substitute for confirming each fact.

Tests should inject `as_of` rather than depend on the wall clock. They should
also reject malformed dates, confirmation before observation, and an invalid
validity interval.

## Evaluation lanes and weak evidence

Keep two visibly different suites:

- **Regression:** behavior that must stay green in every normal run.
- **Challenge / probe:** a small ledger of real misses or deliberately hard
  contrasts. Known failures are reported, not hidden and not allowed to fail
  the regression command. When a challenge is fixed and stable, promote it to
  regression.

Do not treat every raw score as a calibrated probability. Structured states,
decisions, and source chunks may use different features and be sorted in
separate lanes before packing. A single global threshold or top-1/top-2 gap is
therefore misleading until measurement proves the score spaces comparable.

Prefer explainable labels derived from evidence shape, for example:

- `provenance_supported`: selected through an explicit source link;
- `structured_context`: supported by topic, entity, state, or decision fields;
- `lexical_only`: overlap exists but no stronger contextual support does;
- `checkpoint_passed`: a review date passed without a later confirmation;
- `conflicting_or_superseded`: useful as history, unsafe as current state.

Measure top-k inclusion, forbidden candidates, context-packet sufficiency,
privacy leakage, and human-adjudicated failure categories before tuning score
thresholds.

`SKIP` misses belong first to the upper semantic-triage layer, not automatically
to the deterministic retriever. Start with hand-written contrast cases and real
miss logs. Do not manufacture a large query corpus until those examples reveal
a repeatable failure mode.

## Privacy boundary

**Share the method. Protect the memory.**

Project Pinecone may contain generalized principles, sanitized schemas,
synthetic fixtures, and evaluation methods. It should not contain:

- private conversations or personal archives
- real personal, family, account, or relationship details
- a person's private assistant persona or relationship context
- combinations of details that could reconstruct or identify private history
- copies of a live personal-memory workspace

The project can carry the design lessons, taste, and care that grew from a real
memory system without turning the people or relationships behind it into sample
data.

## Non-goals for the seed stage

- building a universal memory platform
- mirroring an existing private repository
- committing early to a database, vector store, or graph engine
- designing a complete ontology before real experiments require one
- turning a lightweight side project into a maintenance obligation

## Open questions

- Which single synthetic story would make the first useful experiment?
- What is the smallest portable schema worth publishing?
- Which behaviors deserve executable evaluations first?
- How should the visual map evolve without becoming documentation of one
  private implementation?
