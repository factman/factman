# Data

Typed content from `src/data/*.json` (validated against `src/data/schemas` by `pnpm data:validate`).

- One file per data set exports it with its generated type, for example `site` (`site.json`).
- **May depend on:** shared.
- **Read only by:** pages and core. Pages normally go through the repositories in `@core/data`.

See [docs/atomic-design.md](../../../docs/atomic-design.md).
