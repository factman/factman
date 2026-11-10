# Data

Typed content from `src/data/*.json` (validated against `src/data/schemas` by `pnpm data:validate`).

- One entry point per data set, typed with its generated model: `@data/site`, `@data/services`, `@data/clients`, `@data/profile`, `@data/skills`, `@data/experience`, `@data/projects`, `@data/contact`. Import the set you need, never all of them: that keeps each JSON file in the chunks that use it (`pnpm test:build` checks none of them reaches the initial bundle).
- `@data` exports the pure selectors: services by order and related, projects newest first and the featured grid (at most 6), skills grouped by area, the newest 3 posts, clients by order.
- The repositories over them live in `@core/data`: `ServicesRepository`, `ProjectsRepository`, `SkillsRepository`, `ClientsRepository`, plus the `/services/:slug` and `/projects/:slug` resolvers (an unknown slug shows the not-found page).
- **May depend on:** shared.
- **Read only by:** pages and core. Pages normally go through the repositories in `@core/data`.

See [docs/atomic-design.md](../../../docs/atomic-design.md).
