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
// The app's rule: every path but /storybook (which has its own, see storybook.spec.ts).
const csp = vercel.headers
  .find((h) => h.source === '/((?!storybook(?:/|$)).*)')
  ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value;

// Serves pages with the production CSP from vercel.json and checks nothing is blocked: inline
// scripts (event replay, theme) must be allowed by their hashes (pnpm csp:hashes).
for (const [path, h1] of [
  ['/', 'Odunayo Mohammed'],
  ['/services/devops', 'DevOps'],
  ['/404', 'Page not found'],
] as const) {
  test(`${path} works under the production Content-Security-Policy`, async ({ page }) => {
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
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
    expect(violations).toEqual([]);
  });
}
