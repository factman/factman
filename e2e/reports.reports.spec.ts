import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface VercelConfig {
  headers: {
    source: string;
    missing?: unknown[];
    headers: { key: string; value: string }[];
  }[];
}

// Runs in the preview deploy job (pnpm exec playwright test with E2E_VARIANT=reports), after
// tools/reports/add-reports.mjs copied the reports into the preview build (ETE-237). Each report
// must open under its own vercel.json CSP without a violation.
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig;
const REPORTS_CSP = (
  vercel.headers
    .find((h) => h.source === '/:report(coverage|playwright)/:path*')
    ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
).replace('upgrade-insecure-requests', '');

for (const { path, ready } of [
  { path: '/coverage', ready: 'All files' },
  { path: '/playwright', ready: /passed|failed|flaky|skipped|not available/i },
]) {
  test(`${path} opens under the reports CSP`, async ({ page }) => {
    expect(REPORTS_CSP).toContain('script-src');
    const violations: string[] = [];
    page.on('console', (msg) => {
      if (/Content[- ]Security[- ]Policy|CSP/i.test(msg.text())) violations.push(msg.text());
    });
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': REPORTS_CSP },
      });
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(ready).first()).toBeVisible();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    expect(violations).toEqual([]);
  });
}

// The coverage report is served with clean URLs and no trailing slash, like on Vercel (ETE-239):
// its styles must load and its links must reach real pages, down to a source file.
test('/coverage is styled and its links work down to a source file', async ({ page }) => {
  const missing: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
  });
  await page.goto('/coverage');
  test.skip(
    !(await page.getByText('All files').count()),
    'no coverage report in this build (the tests stopped early)',
  );
  // base.css is loaded: it collapses the summary table's borders.
  await expect(page.locator('.coverage-summary')).toHaveCSS('border-collapse', 'collapse');

  await page.locator('.coverage-summary td.file a').first().click();
  await expect(page.locator('h1 a', { hasText: 'All files' })).toBeVisible();
  while (await page.locator('.coverage-summary td.file a').count()) {
    const files = page.locator('.coverage-summary td.file a', { hasText: /\.ts$/ });
    if (await files.count()) {
      await files.first().click();
      break;
    }
    await page.locator('.coverage-summary td.file a').first().click();
  }
  await expect(page.locator('pre.prettyprint')).toBeVisible();
  await expect(page.locator('.cline-any').first()).toBeVisible();
  await page.locator('h1 a', { hasText: 'All files' }).click();
  await expect(page).toHaveURL(/\/coverage$/);
  expect(missing).toEqual([]);
});
