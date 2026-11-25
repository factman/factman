import { expect, type Page, test } from '@playwright/test';

import { CONSENT_COOKIE } from './fixtures/consent';
import { stubGoogle } from './fixtures/google';

// FR-34 (ETE-119): the cookie consent banner, as in the canvas's CookieConsent. These start with no
// stored decision.
test.use({ storageState: { cookies: [], origins: [] } });

const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookie settings' });
const acceptAll = (page: Page) => banner(page).getByRole('button', { name: 'Accept all' });
const acceptNecessary = (page: Page) =>
  banner(page).getByRole('button', { name: 'Accept necessary' });

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
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toHaveCSS('position', 'fixed');
    // Always dark, with the command typed out, then the choices.
    await expect(banner(page)).toHaveAttribute('data-theme', 'dark');
    await expect(banner(page).locator('.fm-term__cmd')).toHaveText('./consent --analytics');
    await expect(acceptAll(page)).toBeVisible();
    // A first visit leaves focus where it was.
    expect(await banner(page).evaluate((el) => el.contains(document.activeElement))).toBe(false);
    // Accept necessary and Accept all are the same size.
    const all = await acceptAll(page).boundingBox();
    const necessary = await acceptNecessary(page).boundingBox();
    expect(all?.height).toBe(necessary?.height);
    expect(all?.width).toBe(necessary?.width);
    // Fixed over the page: the layout under it is the same with it open and closed.
    await page.waitForLoadState('networkidle');
    const open = await page.locator('main').boundingBox();
    await banner(page).focus();
    await page.keyboard.press('Escape');
    await expect(banner(page)).toBeHidden();
    expect(await page.locator('main').boundingBox()).toEqual(open);
  });

  test('docks bottom left on a wide screen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a sheet along the bottom on phones');
    await page.goto('/');
    await expect(acceptAll(page)).toBeVisible();
    const viewport = page.viewportSize();
    // Polled: it rises 16px into place.
    await expect
      .poll(async () => {
        const box = await banner(page).boundingBox();
        return [box?.x, Math.round((box?.y ?? 0) + (box?.height ?? 0))];
      })
      .toEqual([24, (viewport?.height ?? 0) - 24]);
  });

  test('Accept all stores the decision and closes; the next page does not ask', async ({
    page,
  }) => {
    // Previews never load Google's tags, even after Accept all (ETE-120).
    const google = await stubGoogle(page);
    await page.goto('/');
    await acceptAll(page).click();
    await expect(banner(page)).toBeHidden();
    expect((await stored(page))?.choices.analytics).toBe(true);
    await page.goto('/services');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
    expect(google).toEqual([]);
  });

  test('Accept necessary stores the decision and closes', async ({ page }) => {
    await page.goto('/');
    await acceptNecessary(page).click();
    await expect(banner(page)).toBeHidden();
    expect((await stored(page))?.choices.analytics).toBe(false);
  });

  test('Customize saves a per-category choice', async ({ page }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Customize' }).click();
    await banner(page)
      .getByRole('switch', { name: /analytics/ })
      .click();
    await banner(page).getByRole('button', { name: 'Save choices' }).click();
    await expect(banner(page)).toBeHidden();
    expect((await stored(page))?.choices.analytics).toBe(true);
  });

  test('Esc closes it without deciding', async ({ page }) => {
    await page.goto('/');
    await expect(acceptAll(page)).toBeVisible();
    await banner(page).focus();
    await page.keyboard.press('Escape');
    await expect(banner(page)).toBeHidden();
    expect(await stored(page)).toBeNull();
  });

  test('reopens from the privacy page, takes focus and gives it back', async ({ page }) => {
    await page.goto('/privacy');
    await acceptNecessary(page).click();
    await expect(banner(page)).toBeHidden();
    await expect(page.getByText('analytics off')).toBeVisible();

    const change = page.getByRole('button', { name: /Change cookie settings/ });
    await change.click();
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toBeFocused();
    await expect(acceptAll(page)).toBeVisible();
    await page.keyboard.press('a');
    await expect(banner(page)).toBeHidden();
    await expect(change).toBeFocused();
    await expect(page.getByText('analytics on')).toBeVisible();
  });
});
