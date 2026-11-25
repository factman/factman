import { expect, type Page, test } from '@playwright/test';

import { CONSENT_COOKIE } from './fixtures/consent';

// FR-34 (ETE-119): the cookie consent banner. These start with no stored decision.
test.use({ storageState: { cookies: [], origins: [] } });

const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookie settings' });

/** The stored decision, from the cookie or (cookies blocked) localStorage. */
async function stored(page: Page) {
  const cookie = (await page.context().cookies()).find((c) => c.name === CONSENT_COOKIE);
  const raw = cookie
    ? decodeURIComponent(cookie.value)
    : await page.evaluate((key) => localStorage.getItem(key), CONSENT_COOKIE);
  return raw ? (JSON.parse(raw) as { choices: Record<string, boolean> }) : null;
}

test.describe('cookie consent banner', () => {
  test('asks on a first visit without taking focus or shifting the page', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('main').boundingBox();
    await expect(banner(page)).toBeVisible();
    // Fixed over the page: the layout under it does not move.
    expect(await page.locator('main').boundingBox()).toEqual(before);
    await expect(banner(page)).toHaveCSS('position', 'fixed');
    // A first visit leaves focus where it was.
    expect(await banner(page).evaluate((el) => el.contains(document.activeElement))).toBe(false);
    // Accept and Reject are the same size.
    const accept = await banner(page)
      .getByRole('button', { name: /Accept all/ })
      .boundingBox();
    const reject = await banner(page)
      .getByRole('button', { name: /Reject all/ })
      .boundingBox();
    expect(accept?.height).toBe(reject?.height);
  });

  test('Accept all stores the decision and closes; the next page does not ask', async ({
    page,
  }) => {
    await page.goto('/');
    await banner(page)
      .getByRole('button', { name: /Accept all/ })
      .click();
    await expect(banner(page)).toBeHidden();
    expect((await stored(page))?.choices.analytics).toBe(true);
    await page.goto('/services');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
  });

  test('Reject all stores the decision and closes', async ({ page }) => {
    await page.goto('/');
    await banner(page)
      .getByRole('button', { name: /Reject all/ })
      .click();
    await expect(banner(page)).toBeHidden();
    expect((await stored(page))?.choices.analytics).toBe(false);
  });

  test('Esc closes it without deciding', async ({ page }) => {
    await page.goto('/');
    await banner(page)
      .getByRole('button', { name: /Reject all/ })
      .focus();
    await page.keyboard.press('Escape');
    await expect(banner(page)).toBeHidden();
    expect(await stored(page)).toBeNull();
  });

  test('reopens from the privacy page, takes focus and gives it back', async ({ page }) => {
    await page.goto('/privacy');
    await banner(page)
      .getByRole('button', { name: /Reject all/ })
      .click();
    await expect(banner(page)).toBeHidden();
    await expect(page.getByText('analytics off')).toBeVisible();

    const change = page.getByRole('button', { name: /Change cookie settings/ });
    await change.click();
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByRole('button', { name: /Accept all/ })).toBeFocused();
    await page.keyboard.press('a');
    await expect(banner(page)).toBeHidden();
    await expect(change).toBeFocused();
    await expect(page.getByText('analytics on')).toBeVisible();
  });
});
