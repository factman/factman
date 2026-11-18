import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;
const baseURL = `http://localhost:${PORT}`;

/**
 * Visual regression (ETE-84): screenshots of every atom, molecule and template story, Light and
 * Dark, against the static Storybook in the build (dist/factman/browser/storybook). Baselines are
 * made on Linux in CI, because fonts render differently on each OS: see docs/visual-regression.md.
 */
export default defineConfig({
  testDir: './vr',
  testMatch: '**/*.vr.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? 4 : undefined,
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never', outputFolder: 'vr-report' }]]
    : 'list',
  expect: {
    // Agreed thresholds (docs/visual-regression.md): a pixel counts as changed past 0.2 colour
    // distance, and a story fails when more than 1% of its pixels change.
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 1600 },
    // Moving components show their final state (counters, typewriter, pulses).
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `pnpm exec serve dist/factman/browser --listen ${PORT} --no-clipboard`,
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
  },
});
