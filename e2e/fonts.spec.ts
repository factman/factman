import { expect, test } from '@playwright/test';

// SEC (ETE-23): fonts are self-hosted, so nothing goes to Google, and only what a page uses is fetched.
test('fonts load from our origin only, and only the ones the page uses', async ({
  page,
  baseURL,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  expect(requests.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);

  const fontRequests = requests.filter((u) => u.endsWith('.woff2'));
  expect(fontRequests.length).toBeGreaterThan(0);
  for (const u of fontRequests) expect(u.startsWith(`${baseURL}/assets/fonts/`)).toBe(true);

  // Body text uses Plus Jakarta Sans (preloaded); the home shell renders no logo wordmark or code.
  expect(fontRequests.some((u) => u.includes('plus-jakarta-sans-latin-v'))).toBe(true);
  expect(fontRequests.some((u) => u.includes('/jost-'))).toBe(false);
  expect(fontRequests.some((u) => u.includes('/jetbrains-mono-'))).toBe(false);

  expect(await page.evaluate(() => document.fonts.check('16px "Plus Jakarta Sans"'))).toBe(true);
});
