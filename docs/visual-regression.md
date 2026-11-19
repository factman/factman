# Visual regression

Screenshots of every atom, molecule and template story, in Light and Dark, compared with
committed baselines on every pull request (ETE-84). A changed pixel shows up as a failing CI job
with a diff to review, before it reaches the site.

## How it runs

- **What:** each story under `Atoms/`, `Molecules/` and `Templates/` in the built Storybook
  (`dist/factman/browser/storybook`, in the preview build: `pnpm build:preview`), once with
  `theme: light` and once with `theme: dark`.
- **Where:** Chromium on Linux, 1280 × 1600, with reduced motion, so counters, typing and pulses
  show their final state. Animations are disabled and the text caret is hidden.
- **Baselines:** `vr/__screenshots__/<story-id>--<theme>.png`, made on Linux in CI. Fonts render
  differently on macOS and Windows, so a baseline made on a laptop would fail in CI. Never commit
  screenshots made locally.
- **CI:** the `Visual regression` job (`.github/workflows/ci.yml`) runs after the build and
  always uploads the run's screenshots and HTML report as the `vr-screenshots` artifact.
- **Locally:** `pnpm vr` runs the comparison against a local build. It is useful for checking
  that stories render, but expect font differences against the Linux baselines.

## Thresholds (agreed with the owner, 2026-11-18)

| Setting             | Value | Meaning                                                              |
| ------------------- | ----- | -------------------------------------------------------------------- |
| `threshold`         | 0.2   | How different a pixel's colour must be to count as changed (0 to 1). |
| `maxDiffPixelRatio` | 0.01  | A story fails when more than 1% of its pixels changed.               |

Both are in `playwright.vr.config.ts`. Stricter values catch smaller changes but fail more often
on anti-aliasing noise.

## Updating baselines

A baseline changes only when a component's look changes on purpose.

1. Make the change and open the pull request. The `Visual regression` job fails on the stories
   that changed, and on any new story (no baseline yet).
2. Download the `vr-screenshots` artifact from that run. Its `vr-report` shows each diff;
   `vr-actual` holds the new screenshots.
3. Copy the new screenshots for the intended changes into `vr/__screenshots__` (named
   `<story-id>--<theme>.png`) and push them to the same pull request.
4. **Approval (agreed 2026-11-18):** the project owner, as the pull request's reviewer, checks
   the screenshot changes and approves them before it merges. A baseline change nobody asked for is a regression, not an
   update.

A new story needs its two baselines the same way, from its first CI run.
