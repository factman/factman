# ADR-002: Standalone components, NgModules for services

- **Status:** Accepted
- **Date:** 2026-11-10
- **Issue:** ETE-40

## Context

The app is standalone Angular: every component, directive and pipe is standalone and grouped by folder (Atomic Design, [docs/atomic-design.md](../atomic-design.md)). App-wide services still need a home: site settings, data access, theme, SEO, analytics and consent. Each concern needs configuration from `site.json`, and that configuration differs between production and preview deployments (previews are `noindex` with analytics off).

The PRD (sections 8 and 9) and the ETE-8, ETE-40 and ETE-41 issues plan one NgModule per concern, assembled by `CoreModule.forRoot()`.

## Options considered

1. **NgModules for services:** `CoreModule.forRoot(options)` imports `DataModule`, `ThemeModule`, `SeoModule`, `AnalyticsModule` and `ConsentModule`; `SharedModule` exports the shared standalone directives and pipes.
   - Pros: matches the PRD and every issue; one familiar entry point; `forRoot()` plus a double-import guard makes "configure once" explicit; each concern is one discoverable file.
   - Cons: an older idiom; `app.config.ts` needs `importProvidersFrom()`; module boilerplate.
2. **Provider functions:** `provideCore(site)` composing `provideData()`, `provideTheme()` …, as Angular recommends for standalone apps.
   - Pros: the current idiom; no module classes; slightly better tree-shaking.
   - Cons: diverges from the PRD and the issue wording, which would need rewriting; no built-in "loaded once" guard.

## Decision

Use **NgModules for services** (option 1), chosen by the owner on 10 Nov 2026, with these rules:

- **Components stay standalone.** Modules provide services only; no module declares a component.
- **One module per concern** under `src/app/core/<concern>/`, each with an `index.ts` public API (`@core/<concern>`).
- **`CoreModule.forRoot({ environment })`** is imported once, in `app.config.ts`, through `importProvidersFrom()`. It provides `SITE` (`site.json` with the environment's overrides applied by `resolveSite()`). Importing it a second time throws.
- **The environment is chosen at build time**, never at run time: angular.json `define` sets `FM_SITE_ENV` to `'production'`, and the `preview` configuration (`pnpm build:preview`, used for Vercel preview deployments) sets `'preview'`.
- **Services needed at start-up** (title strategy, site meta, theme) are registered by their module. **Data repositories are `providedIn: 'root'`** and not registered eagerly, so each JSON file ships only in the lazy chunks that read it (ETE-41).
- **`SharedModule`** exports standalone directives and pipes for molecules and above. Framework-free helpers and the generated data models are plain `@shared` exports.

## Consequences

- One place configures the app; concerns are easy to find and test in isolation (`TestBed` with `importProvidersFrom(CoreModule.forRoot(...))`).
- Moving to provider functions later is mechanical: each module's `providers` array becomes a `provideX()` function, and `forRoot()` becomes `provideCore()`. Revisit if Angular deprecates NgModule-based providers.
- New app-wide services go into the module of their concern, or a new `core/<concern>` folder with its own module and `index.ts`.
