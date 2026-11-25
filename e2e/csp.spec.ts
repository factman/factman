import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface VercelHeader {
  key: string;
  value: string;
}
interface VercelConfig {
  headers: { source: string; has?: unknown[]; headers: VercelHeader[] }[];
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig;
// The app's rule on the production hosts: every path but /storybook (which has its own, see
// storybook.spec.ts). Other hosts get the same policy plus the Vercel Toolbar's sources.
const csp = vercel.headers
  .find((h) => h.source === '/((?!(?:storybook|coverage|playwright)(?:/|$)).*)' && h.has)
  ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value;

// Serves pages with the production CSP from vercel.json and checks nothing is blocked: inline
// scripts (event replay, theme) must be allowed by their hashes (pnpm csp:hashes).
for (const [path, h1] of [
  ['/', 'Odunayo Mohammed'],
  ['/services/devops', 'DevOps'],
  ['/404', 'command not found'],
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
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    expect(violations).toEqual([]);
  });
}

// Every Google script on the page (gtm.js, Tag Assistant's preview, a tag's own library) creates
// its own `goog#html` Trusted Types policy, so the CSP allows duplicates; a policy it doesn't list
// is still refused.
test('Google scripts can each create goog#html; unlisted policies are refused', async ({
  page,
}) => {
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
  const result = await page.evaluate(() => {
    const tt = (
      window as unknown as {
        trustedTypes: { createPolicy(name: string, rules: object): unknown };
      }
    ).trustedTypes;
    const attempt = (name: string) => {
      try {
        tt.createPolicy(name, {});
        return 'created';
      } catch {
        return 'refused';
      }
    };
    return [attempt('goog#html'), attempt('goog#html'), attempt('not-listed')];
  });
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  expect(result).toEqual(['created', 'created', 'refused']);
});
