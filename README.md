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
- contiguous-phrase ranking, so word order survives a bag-of-tokens scorer;
- control-plane exclusion expressed as a rule rather than a list of noticed paths;
- traces that expire on a schedule and explain every rejection they record;
- retrieval-intent parsing measured against a declared ceiling it has not yet met;
- metadata-only raw catalogs and default-off cold retrieval;
- targeted source revival with integrity verification;
- ownership, evidence fidelity, privacy, and failure boundaries.

No build step or external dependency is required. Open `index.html` directly in a browser.

## Memory Graph Explorer

[`docs/memory-graph-explorer.html`](./docs/memory-graph-explorer.html) turns the same architecture into something you can poke at. Nodes are the question, the people named in the records, the topics they sit under, and the records themselves; edges are `related`, `source` and `mentions`.

Press **Start retrieval** and one question walks the graph in seven stages. A question made almost entirely of filler carries a single three-word anchor; plain token overlap puts the wrong record first; contiguity overtakes it; three negative controls are refused for three different stated reasons; a span that appears in nine records is disqualified by counting; provenance keeps the derived view behind the record it points at; and the survivors gather into a `Context Packet` with a visible token budget.

The interesting frame is the second one, where the wrong answer is winning. That is not staged for drama — it is the state the ranking is actually in before word order is taken into account.

Drag nodes, drag the background to pan, scroll to zoom, click any node for its fields and evidence labels. Step or replay at three speeds, switch EN/中文 and light/dark, or use *Cinema* for a clean full-width view when recording.

It is deliberately unglamorous underneath: one SVG scene, a small force-directed layout, and a scripted run over a fixture in [`docs/graph-data.js`](./docs/graph-data.js). No graph database, no vector store, no build step, and no dependency to install — the fixture is the only thing you need to edit to tell a different story.

The scenario dramatizes the candidate evaluations in [DRAFT.md](./DRAFT.md): similar wording in a different context, a time-aware state without a TTL, an alias that must not capture every mention, and a changed choice whose rationale survives.

## Privacy boundary

These are generalized, sanitized reference materials. They intentionally omit private conversations, identities, account or family details, local usernames and absolute paths, live archive counts, and copies of any personal-memory workspace.

## Status

Seed stage. Documentation plus one interactive demo; no retrieval engine is bundled here. The bilingual guides distinguish checked implementation mechanisms from proposed experiments and unresolved boundaries. See the [synthetic boundary cases](./DRAFT.md#third-candidate-evaluation-strict-data-permissive-input) for concrete examples.

Keep it small, inspectable, privacy-aware, and easy to rebuild.

The current reference deliberately stays file-backed. It does not require a database, embeddings, or a retrieval platform before measured failures justify one.
