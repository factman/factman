import AxeBuilder from '@axe-core/playwright';
import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

// WCAG 2.2 AA (ETE-127): axe on every prerendered page and on each state that opens over a page
// (menu, consent prompt, dialogs), in Light and Dark. Components are checked one by one in
// Storybook (addon-a11y, every story); this checks them composed into pages. Reduced motion
// shows every section in its end state, so a reveal mid-fade can't read as low contrast.
// Chromium for the desktop layout, Pixel 7 for the phone layout (menu, consent sheet).

test.use({ reducedMotion: 'reduce' });
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'axe reads the DOM: Chromium (desktop) and Pixel 7 (phone) cover both layouts',
);

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const THEMES = ['light', 'dark'] as const;

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/** Opens a page in a theme and lets every deferred section load. */
async function open(page: Page, path: string, theme: (typeof THEMES)[number]) {
  await page.addInitScript((t) => localStorage.setItem('fm_theme', t), theme);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  // Scroll through once so viewport-deferred sections hydrate as a reader's would.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

/** The violations, as one readable line each (rule, impact, first targets). */
async function violations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}${v.nodes.length > 3 ? ` +${v.nodes.length - 3}` : ''}`,
  );
}

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test('every page passes axe', async ({ page, request }) => {
      test.setTimeout(240_000);
      const found: string[] = [];
      for (const path of [...(await sitemapPaths(request)), '/no-such-page']) {
        await open(page, path, theme);
        for (const v of await violations(page)) found.push(`${path}: ${v}`);
      }
      expect(found).toEqual([]);
    });

    test('the résumé preview passes axe', async ({ page }) => {
      await open(page, '/', theme);
      await page
        .getByRole('button', { name: 'Preview Fullstack Software Engineer résumé' })
        .click();
      const dialog = page.getByRole('dialog', {
        name: 'Fullstack Software Engineer résumé preview',
      });
      await expect(dialog).toBeVisible();
      expect(await violations(page, 'dialog[open], [role="dialog"]')).toEqual([]);
    });

    test('the scheduler passes axe', async ({ page }) => {
      await open(page, '/services', theme);
      await page.locator('main').getByRole('button', { name: 'Schedule a call' }).first().click();
      await expect(page.getByRole('dialog').last()).toBeVisible();
      expect(await violations(page, 'dialog[open], [role="dialog"]')).toEqual([]);
    });

    test('the phone menu passes axe', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'the menu is the phone layout');
      await open(page, '/services', theme);
      await page.locator('header').getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
      expect(await violations(page, 'header')).toEqual([]);
    });

    test.describe('with no stored decision', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test('the consent prompt and its custom choices pass axe', async ({ page }) => {
        await open(page, '/', theme);
        const banner = page.getByRole('dialog', { name: 'Cookie settings' });
        await expect(banner.getByRole('button', { name: 'Accept all' })).toBeVisible();
        expect(await violations(page, 'dialog[open], [role="dialog"]')).toEqual([]);
        await banner.getByRole('button', { name: /Customi[sz]e/ }).click();
        expect(await violations(page, 'dialog[open], [role="dialog"]')).toEqual([]);
      });
    });
  });
}

test.describe('reflow (WCAG 1.4.10)', () => {
  // 320 CSS px wide is a 1280 px screen at 400% zoom, and covers 200%.
  test.use({ viewport: { width: 320, height: 640 } });

  test('no page scrolls sideways at 320 px', async ({ page, request }) => {
    test.setTimeout(240_000);
    const found: string[] = [];
    for (const path of await sitemapPaths(request)) {
      await open(page, path, 'light');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 0) found.push(`${path}: ${overflow} px`);
    }
    expect(found).toEqual([]);
  });
});
