import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface VercelConfig {
  headers: {
    source: string;
    has?: { type: string; value: unknown }[];
    headers: { key: string; value: string }[];
  }[];
}

// Runs against the production build only (pnpm e2e:production). Storybook (ETE-236) and the test
// reports (ETE-237) are not in it: each path is the app's 404 page, and the production hosts send
// the app's strict CSP there.
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig;
const csp = (rule?: VercelConfig['headers'][number]) =>
  rule?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
const APP_CSP = csp(
  vercel.headers.find((h) => h.source === '/((?!(?:storybook|coverage|playwright)(?:/|$)).*)'),
);
const PRODUCTION_TOOLS_CSP = csp(
  vercel.headers.find(
    (h) =>
      h.source === '/:tool(storybook|coverage|playwright)/:path*' &&
      h.has?.some((c) => c.type === 'host'),
  ),
);

const paths = [
  '/storybook',
  '/storybook/index.html',
  '/storybook/iframe.html',
  '/storybook/index.json',
  '/coverage',
  '/coverage/index.html',
  '/coverage/coverage-summary.json',
  '/playwright',
  '/playwright/index.html',
];

for (const path of paths) {
  test(`${path} is not found in production`, async ({ request }) => {
    // cleanUrls may first drop a .html extension (Vercel 308, serve 301); the end is still a 404.
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(new URL(response.url()).pathname).toMatch(/^\/(storybook|coverage|playwright)/);
  });
}

for (const path of ['/storybook', '/coverage', '/playwright']) {
  test(`${path} shows the app 404 page under the app CSP on the production hosts`, async ({
    page,
  }) => {
    expect(PRODUCTION_TOOLS_CSP).toBe(APP_CSP);
    expect(APP_CSP).not.toContain('unsafe-eval');
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
          'content-security-policy': PRODUCTION_TOOLS_CSP.replace('upgrade-insecure-requests', ''),
        },
      });
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle('Page not found · Odunayo Mohammed');
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    expect(violations).toEqual([]);
  });
}
