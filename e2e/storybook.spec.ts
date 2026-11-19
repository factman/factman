import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface VercelConfig {
  headers: { source: string; has?: unknown[]; headers: { key: string; value: string }[] }[];
}

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as VercelConfig;
const cspFor = (source: string) =>
  (
    vercel.headers
      // The rule without a host condition: the preview one (ETE-236).
      .find((h) => h.source === source && !h.has)
      ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
  ).replace('upgrade-insecure-requests', '');
const APP_CSP = cspFor('/((?!storybook(?:/|$)).*)');
const STORYBOOK_CSP = cspFor('/storybook/:path*');

// The preview build ships the static Storybook at /storybook (ETE-220, ETE-236). It must load a story, with
// every file found, under its own production CSP (script hashes, same-origin preview frame).
test('/storybook loads a story under its production Content-Security-Policy', async ({ page }) => {
  expect(STORYBOOK_CSP).toContain('script-src');
  const violations: string[] = [];
  const missing: string[] = [];
  page.on('console', (msg) => {
    if (/Content[- ]Security[- ]Policy|CSP|unsafe-eval/i.test(msg.text()))
      violations.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400) missing.push(`${res.status()} ${res.url()}`);
  });
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    const path = new URL(route.request().url()).pathname;
    const storybook = path === '/storybook' || path.startsWith('/storybook/');
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': storybook ? STORYBOOK_CSP : APP_CSP,
      },
    });
  });

  await page.goto('/storybook?path=/story/atoms-logo--lockup');
  // Exact: other stories contain "Logo" too (ClientLogo), and names match as substrings otherwise.
  // On phones the sidebar is collapsed; the toolbar shows the story's path instead.
  await expect(
    page
      .getByRole('button', { name: 'Logo', exact: true })
      .or(page.getByText('Atoms/Logo/Lockup', { exact: true }))
      .first(),
  ).toBeVisible();
  const preview = page.frameLocator('#storybook-preview-iframe');
  await expect(preview.locator('#storybook-root > *').first()).toBeVisible();
  // Storybook keeps lazy-loading (addons, fonts) after the story renders; stop intercepting
  // before the test ends so an in-flight route.fetch isn't reported as an error.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  expect(violations).toEqual([]);
  expect(missing).toEqual([]);
});
