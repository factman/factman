# Core

App-wide services and providers, one NgModule per concern (ADR-002). Components stay standalone; modules provide services only.

| Concern     | Module            | Provides                                                                                      |
| ----------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `config`    | (part of `CoreModule`) | `SITE`: `site.json` for this build's environment                                        |
| `data`      | `DataModule`      | Typed repositories and route resolvers (`providedIn: 'root'`, loaded with the pages that use them) |
| `theme`     | `ThemeModule`     | Light and Dark theme (FR-04)                                                                  |
| `seo`       | `SeoModule`       | Page titles (`site.titleTemplate`), site-wide description and robots meta                    |
| `analytics` | `AnalyticsModule` | `ANALYTICS`: GTM and GA4 settings (off on previews)                                          |
| `consent`   | `ConsentModule`   | `CONSENT`: cookie name, version and categories                                                |

`CoreModule.forRoot({ environment })` (`@core`) imports all of them and is imported once, in `app.config.ts`. The environment comes from `FM_SITE_ENV`, set at build time: `pnpm build` builds production, `pnpm build:preview` builds a preview (noindex, analytics off).

- **May depend on:** core, shared, data.
- Import a concern through its alias: `@core/config`, `@core/data`, `@core/theme` …

See [docs/atomic-design.md](../../../docs/atomic-design.md) and [ADR-002](../../../docs/adr/002-standalone-components-ngmodules-for-services.md).
