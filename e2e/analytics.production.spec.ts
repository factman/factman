import { expect, type Page, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

import { CONSENT_COOKIE } from './fixtures/consent';
import { stubGoogle } from './fixtures/google';

// ETE-120: Google Tag Manager and GA4 load only after the visitor allows analytics. Runs against the
// production build (pnpm e2e:production), the only one with analytics on, under the app's own CSP
// from vercel.json so Trusted Types are enforced. Google's hosts are stubbed: no real tag loads and
// no hit is sent.
test.use({ storageState: { cookies: [], origins: [] } });

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8')) as {
  analytics: { gtmId: string; ga4Id: string };
};
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; has?: unknown[]; headers: { key: string; value: string }[] }[];
};
/** The app's CSP, without upgrade-insecure-requests (the test server is plain http). */
const CSP = (
  vercel.headers
    .find((h) => h.source === '/((?!(?:storybook|coverage|playwright)(?:/|$)).*)' && !h.has)
    ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
)
  .replace(/;\s*upgrade-insecure-requests/, '')
  .trim();

const GTM = `https://www.googletagmanager.com/gtm.js?id=${site.analytics.gtmId}`;
const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookie settings' });

/** Serves pages with the app's CSP and records CSP and Trusted Types errors. */
async function withCsp(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Trusted Type/i.test(m.text()))
      errors.push(m.text());
  });
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': CSP },
    });
  });
  return errors;
}

/** The data layer's entries: gtag commands as arrays, events as objects. */
const layer = (page: Page) =>
  page.evaluate(() =>
    ((window as { dataLayer?: unknown[] }).dataLayer ?? []).map((e) =>
      e && typeof e === 'object' && 'length' in e ? Array.from(e as ArrayLike<unknown>) : e,
    ),
  );
const pageViews = async (page: Page) =>
  (await layer(page)).filter(
    (e): e is { event: string; page_path: string } =>
      !Array.isArray(e) && (e as { event?: string })?.event === 'page_view',
  );

test.describe('analytics after consent (ETE-120)', () => {
  test('nothing from Google before a decision or after Accept necessary', async ({ page }) => {
    const errors = await withCsp(page);
    const google = await stubGoogle(page);
    await page.goto('/');
    await expect(banner(page).getByRole('button', { name: 'Accept necessary' })).toBeVisible();
    expect(google).toEqual([]);
    await banner(page).getByRole('button', { name: 'Accept necessary' }).click();
    await page.goto('/services');
    await expect(page.locator('main h1')).toBeVisible();
    expect(google).toEqual([]);
    expect(await layer(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('Accept all loads GTM under Trusted Types and sends each page by path', async ({ page }) => {
    const errors = await withCsp(page);
    const google = await stubGoogle(page);
    await page.goto('/privacy?ref=newsletter#top');
    await banner(page).getByRole('button', { name: 'Accept all' }).click();

    await expect.poll(() => google).toEqual([GTM]);
    const entries = await layer(page);
    expect(entries[0]).toEqual([
      'consent',
      'default',
      expect.objectContaining({ analytics_storage: 'granted', ad_storage: 'denied' }),
    ]);
    expect(await pageViews(page)).toEqual([
      expect.objectContaining({
        page_path: '/privacy',
        page_location: expect.stringMatching(/:\d+\/privacy$/),
      }),
    ]);

    // A page change in the app is one more page view; GTM isn't loaded again.
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Home' })
      .click();
    await expect(page.locator('#about')).toBeAttached();
    await expect
      .poll(async () => (await pageViews(page)).map((v) => v.page_path))
      .toEqual(['/privacy', '/']);
    expect(google).toEqual([GTM]);

    // A returning visitor gets GTM on their first page.
    await page.goto('/services');
    await expect.poll(() => google).toEqual([GTM, GTM]);
    expect(errors).toEqual([]);
  });

  test('withdrawing consent switches GA4 off and deletes its cookies', async ({
    page,
    context,
    baseURL,
  }) => {
    const errors = await withCsp(page);
    await stubGoogle(page);
    await page.goto('/privacy');
    await banner(page).getByRole('button', { name: 'Accept all' }).click();
    await expect(banner(page)).toBeHidden();
    const host = new URL(baseURL!).hostname;
    await context.addCookies([
      { name: '_ga', value: 'GA1.1.1', domain: host, path: '/' },
      { name: `_ga_${site.analytics.ga4Id.slice(2)}`, value: 'GS1.1', domain: host, path: '/' },
    ]);

    await page.getByRole('button', { name: /Change cookie settings/ }).click();
    await banner(page).getByRole('button', { name: 'Accept necessary' }).click();
    await expect(banner(page)).toBeHidden();

    expect((await layer(page)).at(-1)).toEqual([
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'denied' }),
    ]);
    expect(
      await page.evaluate((id) => (window as never)[`ga-disable-${id}`], site.analytics.ga4Id),
    ).toBe(true);
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).toContain(CONSENT_COOKIE);
    expect(names.filter((n) => n.startsWith('_ga'))).toEqual([]);
    expect(errors).toEqual([]);
  });
});
