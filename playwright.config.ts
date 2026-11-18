import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;
const baseURL = process.env['E2E_BASE_URL'] ?? `http://localhost:${PORT}`;

/**
 * E2E runs against the prerendered static build (dist/factman/browser),
 * the same files Vercel serves. Set E2E_BASE_URL to test a deployed preview instead.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'pixel', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: `pnpm exec serve dist/factman/browser --listen ${PORT} --no-clipboard`,
        url: baseURL,
        reuseExistingServer: !process.env['CI'],
      },
});
