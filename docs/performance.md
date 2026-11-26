# Performance budgets (PF, ETE-126)

Three checks keep the site fast. All run in CI.

| Check               | Where                                                                  | Fails when                                                                        |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Lighthouse CI       | `pnpm lhci` (`lighthouserc.cjs`), CI's E2E job on the production build | Any category is under 95; LCP is over 1.8 s; CLS is over 0.02; TBT is over 200 ms |
| Per-page JavaScript | `tools/build/bundles.test.mjs` (`pnpm test:build`)                     | A page's entry script and modulepreloads, gzipped, pass its ceiling               |
| Angular budgets     | `angular.json`                                                         | The initial bundle passes 450 kB (raw), or a component's styles pass 8 kB         |

Lighthouse runs its mobile emulation (slow 4G, 4× CPU slowdown), the median of 3 runs, on `/`, `/services`, `/services/devops`, `/projects`, a project page, `/blog` and `/privacy`.

## Results (2026-11-26, production build)

| Page                                           | Perf | A11y | Best practices | SEO | LCP          | CLS | TBT         |
| ---------------------------------------------- | ---- | ---- | -------------- | --- | ------------ | --- | ----------- |
| `/`                                            | 100  | 100  | 96             | 100 | 0.9 s        | 0   | 11 ms       |
| `/services`                                    | 93   | 96   | 96             | 100 | 3.2 s (warn) | 0   | 13 ms       |
| `/services/devops`                             | 92   | 100  | 96             | 100 | 3.3 s (warn) | 0   | 14 ms       |
| `/projects`, project page, `/blog`, `/privacy` | 100  | 100  | 96             | 100 | 0.75 s       | 0   | under 30 ms |

JavaScript per page, gzipped: 202 KB (`/privacy`) to 227 KB (`/`). Angular's initial bundle is 102 KB gzipped (366 kB raw).

## What was fixed

- **Layout shift, 0.087 to 0.** The consent banner is docked at the bottom of the screen. When its message and buttons appeared after the typed command, it grew upwards, and that counted as a shift. They are now in the layout from the start, hidden and inert until the command is typed.
- **LCP image discovery.** `fm-image` with `priority` now adds `<link rel="preload" as="image">` to the prerendered `<head>`. It uses the AVIF or WebP `imagesrcset` and `imagesizes`, so the browser starts the hero photo before the scripts.
- **Résumé card thumbnails, 186 KB to 76 KB.** The card used the full print preview (1189 px wide). `build-resumes.ts` now also writes `-page-1-thumb.webp` at 680 px, twice the card's width, and the card uses that.

## Tradeoffs and follow-ups

- **One UI-kit chunk for every page.** Every route imports the `@ui/*` barrels, and esbuild can't drop the unused components. So every page downloads one chunk with all 27 organisms (about 90 KB gzipped), which sets the floor of the per-page budgets. Marking the folder side-effect free doesn't help, because the Angular build resolves the path aliases itself. The fix is deep imports per component, which changes the layer boundaries, so it is a separate follow-up (ETE-272).
- **The services pages' LCP warns rather than fails.** Their LCP is the hero photo, which shares slow 4G with that JavaScript: about 0.1 s measured, about 3.3 s simulated. They go back to errors once the chunking work lands.
- **SEO skips `is-crawlable` until launch.** The site is `noindex` on purpose until then. ETE-235 removes the skip.
- **Best practices is 96.** Locally, the Vercel Web Analytics script 404s, because it is served only on Vercel. It still passes.
- **Still to optimise** (Lighthouse estimates about 200 KB on the home page):
  - client logos: PNGs up to 640 px wide, shown small;
  - the profile photos' `sizes`, which pick a larger file than they need.

  Both are in the follow-up, ETE-272.

- **Accessibility: the services cards' "more →" in dark mode** has 4.26:1 contrast. It belongs to the WCAG audit (ETE-127), because the fix changes a molecule's visual-regression baselines.
