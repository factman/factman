# Shared

Helpers, types and the shared standalone directives and pipes. No components.

- Framework-free helpers and the generated data models (`pnpm data:types`) are plain exports of `@shared`.
- `SharedModule` exports the standalone directives and pipes used by molecules, organisms, templates and pages. Atoms use tokens only, so they never import `@shared`.
- **May depend on:** nothing.

See [docs/atomic-design.md](../../../docs/atomic-design.md) and [ADR-002](../../../docs/adr/002-standalone-components-ngmodules-for-services.md).
