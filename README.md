# Project Pinecone

*Small seeds. Durable memory. A forest of context.*

Project Pinecone is a small, provenance-first home for experiments around durable memory, retrieval, and context. It publishes reusable patterns and synthetic examples without copying the private memories or live workspace that inspired them.

## Architecture and workflow

[`index.html`](./index.html) is the bilingual entry point.

| Artifact | English | 中文 |
| --- | --- | --- |
| Visual architecture | [memory-system-architecture.en.html](./docs/memory-system-architecture.en.html) | [memory-system-architecture.zh.html](./docs/memory-system-architecture.zh.html) |
| Assistant workflow | [assistant-memory-workflow.en.md](./docs/assistant-memory-workflow.en.md) | [assistant-memory-workflow.zh.md](./docs/assistant-memory-workflow.zh.md) |
| Interactive graph | [memory-graph-explorer.html](./docs/memory-graph-explorer.html) | 同一页面，内置 EN/中文 切换 |

The architecture covers:

- durable sources versus rebuildable retrieval data;
- `RETRIEVE / ASK / SKIP` and bounded context;
- time-aware current state without fixed TTLs, with injectable evaluation dates;
- strict canonical-label validation before index publication, with permissive query hints;
- changed decisions preserved as historical rationale alongside their direct successors;
- working-copy permissions, advisory checks, and recovery boundaries;
- separate regression and challenge/probe evaluation lanes (the latter remains a design pattern);
- explainable weak-evidence labels for heterogeneous rankers;
- metadata-only raw catalogs and default-off cold retrieval;
- targeted source revival with integrity verification;
- ownership, evidence fidelity, privacy, and failure boundaries.

No build step or external dependency is required. Open `index.html` directly in a browser.

## Memory Graph Explorer

[`docs/memory-graph-explorer.html`](./docs/memory-graph-explorer.html) turns the same architecture into something you can poke at. Nodes are queries, people, topics, states, decisions and Sessions; edges are `related`, `source`, `supersedes` and `mentions`.

Press **Start retrieval** and one question walks the graph in seven stages: hints are parsed, similarity over-recalls on purpose, structured metadata dims what does not belong, a passed checkpoint attaches a review note without changing rank, one superseded decision returns explicitly marked as history, provenance links back to canonical Sessions, and the survivors gather into a `Context Packet` with a visible token budget.

Drag nodes, drag the background to pan, scroll to zoom, click any node for its fields and evidence labels. Step or replay at three speeds, switch EN/中文 and light/dark, or use *Cinema* for a clean full-width view when recording.

It is deliberately unglamorous underneath: one SVG scene, a small force-directed layout, and a scripted run over a fixture in [`docs/graph-data.js`](./docs/graph-data.js). No graph database, no vector store, no build step, and no dependency to install — the fixture is the only thing you need to edit to tell a different story.

The scenario dramatizes the candidate evaluations in [DRAFT.md](./DRAFT.md): similar wording in a different context, a time-aware state without a TTL, an alias that must not capture every mention, and a changed choice whose rationale survives.

## Privacy boundary

These are generalized, sanitized reference materials. They intentionally omit private conversations, identities, account or family details, local usernames and absolute paths, live archive counts, and copies of any personal-memory workspace.

## Status

Seed stage. Documentation plus one interactive demo; no retrieval engine is bundled here. The bilingual guides distinguish checked implementation mechanisms from proposed experiments and unresolved boundaries. See the [synthetic boundary cases](./DRAFT.md#third-candidate-evaluation-strict-data-permissive-input) for concrete examples.

Keep it small, inspectable, privacy-aware, and easy to rebuild.

The current reference deliberately stays file-backed. It does not require a database, embeddings, or a retrieval platform before measured failures justify one.
