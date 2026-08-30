# Project Pinecone

*Small seeds. Durable memory. A forest of context.*

Project Pinecone is a small, provenance-first home for experiments around durable memory, retrieval, and context. It publishes reusable patterns and synthetic examples without copying the private memories or live workspace that inspired them.

## Architecture and workflow

[`index.html`](./index.html) is the bilingual entry point.

| Artifact | English | 中文 |
| --- | --- | --- |
| Visual architecture | [memory-system-architecture.en.html](./docs/memory-system-architecture.en.html) | [memory-system-architecture.zh.html](./docs/memory-system-architecture.zh.html) |
| Assistant workflow | [assistant-memory-workflow.en.md](./docs/assistant-memory-workflow.en.md) | [assistant-memory-workflow.zh.md](./docs/assistant-memory-workflow.zh.md) |

The architecture covers:

- durable sources versus rebuildable retrieval data;
- `RETRIEVE / ASK / SKIP` and bounded context;
- metadata-only raw catalogs and default-off cold retrieval;
- targeted source revival with integrity verification;
- ownership, evidence fidelity, privacy, and failure boundaries.

No build step or external dependency is required. Open `index.html` directly in a browser.

## Privacy boundary

These are generalized, sanitized reference materials. They intentionally omit private conversations, identities, account or family details, local usernames and absolute paths, live archive counts, and copies of any personal-memory workspace.

## Status

Seed stage. Keep it small, inspectable, privacy-aware, and easy to rebuild.
