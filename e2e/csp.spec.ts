import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface VercelHeader {
  key: string;
  value: string;
}
interface VercelConfig {
  headers: { source: string; headers: VercelHeader[] }[];
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig;
const csp = vercel.headers
  .flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy')?.value;

// Serves the page with the production CSP from vercel.json and checks nothing is blocked.
test('home works under the production Content-Security-Policy', async ({ page }) => {
  expect(csp).toBeTruthy();
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (/Content[- ]Security[- ]Policy|CSP/i.test(msg.text())) violations.push(msg.text());
  });
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': (csp ?? '').replace('upgrade-insecure-requests', ''),
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Factman' })).toBeVisible();
  expect(violations).toEqual([]);
});
