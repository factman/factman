# End-to-end tests

Playwright against the prerendered build, the same files Vercel serves (`playwright.config.ts`).

- `pnpm e2e`: the preview build, every `*.spec.ts` in five projects: Chromium, Firefox and WebKit
  on a desktop, and Pixel 7 and iPhone 15 (393 px) for phones.
- `pnpm e2e:production`: the production build (analytics on, no Storybook), `*.production.spec.ts`
  in Chromium.

CI runs both on every pull request. A failing test is retried twice there, and its trace,
screenshot and report are kept (`trace: 'on-first-retry'`) in the Playwright report the preview
deployment serves at `/playwright` (docs/test-reports.md).

## PRD §12 journeys

Each journey (ETE-124) and the specs that cover it. `journeys.spec.ts` and
`journeys.production.spec.ts` hold the parts no feature spec covers, named by journey id.

| ID     | Journey                  | Specs                                                                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| E2E-01 | First visit and accept   | `consent.spec.ts`; `analytics.production.spec.ts` (no Google request before the choice, GTM and GA4 after)  |
| E2E-02 | Reject and customize     | `consent.spec.ts`; `analytics.production.spec.ts` (withdrawal); `journeys.spec.ts` (footer "cookie settings") |
| E2E-03 | Recruiter                | `journeys.spec.ts` (360 px); `resume.spec.ts`; `journeys.production.spec.ts` (`resume_download`)              |
| E2E-04 | Client                   | `journeys.spec.ts`; `scheduler.spec.ts`; `journeys.production.spec.ts` (`service_enquiry`)                    |
| E2E-05 | Projects                 | `journeys.spec.ts`                                                                                            |
| E2E-06 | Blog                     | `blog.spec.ts`                                                                                                |
| E2E-07 | Contact form             | `contact.spec.ts`                                                                                             |
| E2E-08 | Theme                    | `theme.spec.ts` (first paint); `journeys.spec.ts` (toggle persists)                                           |
| E2E-09 | Keyboard only            | `routes.spec.ts` (skip link, focus on navigation); `resume.spec.ts`, `scheduler.spec.ts` (dialogs); `journeys.spec.ts` |
| E2E-10 | Reduced motion           | `motion.spec.ts` (reveals, cards, logo strip); `journeys.spec.ts` (typed role, counters)                      |
| E2E-11 | Responsive               | `journeys.spec.ts` (360 px, menu, consent sheet); `resume.spec.ts` (phone preview)                            |
| E2E-12 | No JavaScript            | `journeys.spec.ts`; `motion.spec.ts`; `theme.spec.ts`                                                         |
| E2E-13 | 404                      | `routes.spec.ts`                                                                                              |
| E2E-14 | SEO                      | `journeys.spec.ts`; `routes.spec.ts` (prerendered, noindex 404)                                               |
| E2E-15 | Analytics events         | `journeys.production.spec.ts`; `analytics.production.spec.ts`                                                |
| E2E-16 | Interactive terminal     | `journeys.spec.ts`, skipped while `features.terminal` is off in `site.json`                                   |
| E2E-17 | Link check               | `journeys.spec.ts` (internal links and fragments, every page); external links: the nightly job (ETE-131)      |

Two checks wait on content: E2E-05's private project runs once `projects.json` has one, and
E2E-14 requires JSON-LD only on the home and service pages until the SEO audit adds it to the
rest (ETE-128).

## Accessibility (WCAG 2.2 AA, ETE-127)

`a11y.spec.ts` runs axe (WCAG 2.0, 2.1 and 2.2, A and AA, including 2.5.8 target size) on every
page and the 404, in Light and Dark, at desktop (Chromium) and phone (Pixel 7) widths, and on
each state that opens over a page: the résumé preview, the scheduler, the phone menu and the
consent prompt with its custom choices. It also checks reflow: no page scrolls sideways at
320 px (1.4.10; a 1280 px screen at 400% zoom). Components are checked one by one by Storybook's
axe addon. Keyboard paths (E2E-09) and reduced motion (E2E-10) are in `journeys.spec.ts`,
`routes.spec.ts` and `motion.spec.ts`.

