# Performance budgets (PF, ETE-126)

Three checks keep the site fast. All run in CI.

| Check               | Where                                                                  | Fails when                                                                        |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Lighthouse CI       | `pnpm lhci` (`lighthouserc.cjs`), CI's E2E job on the production build | Any category is under 95; LCP is over 1.8 s; CLS is over 0.02; TBT is over 200 ms |
| Per-page JavaScript | `tools/build/bundles.test.mjs` (`pnpm test:build`)                     | A page's entry script and modulepreloads, gzipped, pass its ceiling               |
| Angular budgets     | `angular.json`                                                         | The initial bundle passes 500 kB (raw), or a component's styles pass 8 kB         |

Lighthouse runs its mobile emulation (slow 4G, 4× CPU slowdown), the median of 3 runs, on `/`, `/services`, `/services/devops`, `/projects`, a project page, `/blog` and `/privacy`.

## Results

CI's Lighthouse figures are in the `lighthouse` artifact of each run. The CI runner is about half as fast as a developer laptop (Lighthouse benchmark index ~2,000 against ~4,500), so measure locally with a higher CPU slowdown to match it (about 9×).

JavaScript per page, gzipped: 131 KB (404) to 153 KB (`/projects`), down from 202 to 227 KB. Angular's initial bundle is 425 kB raw (119 KB gzipped): Angular itself and the router, with no UI kit.

## What was fixed

- **Layout shift, 0.087 to 0.** The consent banner is docked at the bottom of the screen. When its message and buttons appeared after the typed command, it grew upwards, and that counted as a shift. They are now in the layout from the start, hidden and inert until the command is typed.
- **LCP image discovery.** `fm-image` with `priority` now adds `<link rel="preload" as="image">` to the prerendered `<head>`. It uses the AVIF or WebP `imagesrcset` and `imagesizes`, so the browser starts the hero photo before the scripts.
- **Résumé cards no longer load a page image (186 KB each).** The card used the full print preview (1189 px wide). The design's card (ETE-274) shows a 56 px portrait instead, so the preview pages load only in the preview dialog.
- **Total blocking time (about 330 ms in CI on every page) under 200 ms.** One long task did everything at load: evaluating a 720 kB chunk with every UI component, then bootstrapping and hydrating the whole page. Now:
  - **Per-component UI imports.** Pages import each component from its own file (`@ui/atoms/button/button`), not from the level's barrel, which esbuild can't tree-shake. Each page loads only what it renders: 55 to 75 KB less JavaScript. Lint forbids the barrels (docs/atomic-design.md).
  - **A yield before bootstrap** (`main.ts`): evaluating the modules and hydrating are two tasks, not one.
  - **Hydration in pieces.** The header and the home hero are prerendered and hydrate when the browser is idle; the home page's About and logo strip, like its other sections, hydrate as they scroll into view. Each `@defer` block's root is a real box (`.home-block`, `.home-strip`): the organisms' hosts are `display: contents`, which the viewport trigger can't see, so until now the home sections never hydrated.
  - **Later starts.** Vercel Web Analytics and a first visit's consent banner start when the browser is idle (`whenIdle`), the résumé preview loads when it is first opened, and the home sections work out their data when they render.

## Tradeoffs and follow-ups

- **The photo-hero pages' LCP and performance score warn rather than fail** (`/services`, a service page, `/projects`, `/blog`). Their LCP is the hero photo: it paints in about 0.1 s, but Lighthouse's simulation charges it with every script requested before then, about 3 s on slow 4G. Blocking time and every other budget stay errors there.
- **SEO skips `is-crawlable` until launch.** The site is `noindex` on purpose until then. ETE-235 removes the skip.
- **Best practices is 96.** Locally, the Vercel Web Analytics script 404s, because it is served only on Vercel. It still passes.
- **Still to optimise** (Lighthouse estimates about 200 KB on the home page):
  - client logos: PNGs up to 640 px wide, shown small;
  - the profile photos' `sizes`, which pick a larger file than they need.

  Both are in the follow-up, ETE-272.

- **WebKit and a click mid-hydration.** A link click that lands in the same instant its section starts hydrating is dropped by WebKit (Chromium and Firefox replay it). A visitor sees the section before clicking, so it has hydrated; the E2E test waits the same way.

- **Accessibility: the services cards' "more →" in dark mode** has 4.26:1 contrast. It belongs to the WCAG audit (ETE-127), and is still to fix.
