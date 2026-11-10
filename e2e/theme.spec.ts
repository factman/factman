import { expect, test } from '@playwright/test';

// FR-04 (ETE-24): Light and Dark theme, applied before first paint.
const theme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.getAttribute('data-theme'));

test.describe('theme', () => {
  test('the pre-paint script themes the page before Angular loads', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    // Block the app's JavaScript: only the inline pre-paint script can set the theme.
    await page.route(/\/(main|chunk)-[^/]*\.js$/, (route) => route.abort());
    await page.goto('/');
    expect(await theme(page)).toBe('dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(7, 11, 20)'); // dark canvas, neutral-950
    await context.close();
  });

  test('follows the system preference when the visitor has not chosen', async ({ browser }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto('/services');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await context.close();
    }
  });

  test('a stored choice wins over the system preference', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(() => localStorage.setItem('fm_theme', 'light'));
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await context.close();
  });

  test('works with storage blocked', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(() =>
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      }),
    );
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
    await context.close();
  });
});
