# Core

App-wide services and providers, one NgModule per concern (ADR-002). Components stay standalone; modules provide services only.

| Concern     | Module            | Provides                                                                                      |
| ----------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `config`    | (part of `CoreModule`) | `SITE`: `site.json` for this build's environment                                        |
| `data`      | `DataModule`      | Typed repositories and route resolvers (`providedIn: 'root'`, loaded with the pages that use them) |
| `theme`     | `ThemeModule`     | Light and Dark theme (FR-04)                                                                  |
| `seo`       | `SeoModule`       | `SeoService`: per-page title, description, robots, canonical, Open Graph and Twitter tags (route `data.seo` or a `seo` resolver) |
| `analytics` | `AnalyticsModule` | `AnalyticsService` (GTM and GA4 after consent; the `ANALYTICS_TRACKER`); `ANALYTICS` settings |
| `consent`   | `ConsentModule`   | `ConsentService` (stored decision, re-prompt, Consent Mode state); `CONSENT` settings         |

`CoreModule.forRoot({ environment })` (`@core`) imports all of them and is imported once, in `app.config.ts`. The environment comes from `FM_SITE_ENV`, set at build time: `pnpm build` builds production, `pnpm build:preview` builds a preview (noindex, analytics off).

- **May depend on:** core, shared, data.
- Import a concern through its alias: `@core/config`, `@core/data`, `@core/theme` …

See [docs/atomic-design.md](../../../docs/atomic-design.md) and [ADR-002](../../../docs/adr/002-standalone-components-ngmodules-for-services.md).
