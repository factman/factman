# Shared

Helpers, types and the shared standalone directives and pipes. No components.

- Framework-free helpers and the generated data models (`pnpm data:types`) are plain exports of `@shared`.
- `SharedModule` exports the standalone directives and pipes used by molecules, organisms, templates and pages. Atoms use tokens only, so they never import `@shared`.
- **Dates and experience (ETE-42):** content dates are months (`YYYY-MM`). `sortExperience` / `sortByRecency` order the timeline (current roles first, then newest start), `formatDuration` gives `1 yr 8 mos`, `formatPeriod` gives `Jan 2020 – Present`, `yearsSince` and `skillYears` give the computed years, and `counters` derives the stats strip from the data. All take "now" as an argument; components read it from the `CLOCK` token, so tests can fix the date. Pages are prerendered, so these values are fixed at build time.
- **May depend on:** nothing.

See [docs/atomic-design.md](../../../docs/atomic-design.md) and [ADR-002](../../../docs/adr/002-standalone-components-ngmodules-for-services.md).
