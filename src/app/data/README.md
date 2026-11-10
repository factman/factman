# Data

Typed content from `src/data/*.json` (validated against `src/data/schemas` by `pnpm data:validate`).

- One entry point per data set, typed with its generated model: `@data/site`, `@data/services`, `@data/clients`. Import the set you need, never all of them: that keeps each JSON file in the chunks that use it.
- `@data` exports the pure selectors (order, by slug, related …).
- **May depend on:** shared.
- **Read only by:** pages and core. Pages normally go through the repositories in `@core/data`.

See [docs/atomic-design.md](../../../docs/atomic-design.md).
