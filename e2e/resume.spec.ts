import { expect, type Page, test } from '@playwright/test';

// RS suite, browser cases (ETE-110, PRD §12): the résumé section, preview and downloads on the
// prerendered site. The owner kept the built behaviour where the PRD differs (24 Nov): the deep
// link is `#resume=<slug>`, Download is a button, and the cards show page 1 as their thumbnail.
const RESUMES = [
  { slug: 'fullstack', title: 'Fullstack Software Engineer' },
  { slug: 'mobile', title: 'Mobile Developer' },
  { slug: 'devops', title: 'DevOps / Cloud Engineer' },
] as const;

const dialogFor = (page: Page, title: string) =>
  page.getByRole('dialog', { name: `${title} résumé preview` });

/** The app has hydrated: a click before that would be replayed, but waiting keeps it simple. */
async function openHome(page: Page, hash = '') {
  await page.goto(`/${hash}`);
  await page.waitForLoadState('networkidle');
}

test.describe('résumés', () => {
  test('RS-20: preview every variant, see every page, download each PDF', async ({ page }) => {
    await openHome(page, '#resume');
    for (const { slug, title } of RESUMES) {
      await page.getByRole('button', { name: `Preview ${title} résumé` }).click();
      const dialog = dialogFor(page, title);
      await expect(dialog).toBeVisible();
      for (const n of [1, 2]) {
        const image = dialog.getByRole('img', { name: `Page ${n} of 2 of the ${title} résumé` });
        await expect(image).toBeVisible();
        // Decoded, not just laid out (the page image can still be loading when it shows).
        await expect
          .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
          .toBeGreaterThan(0);
        if (n === 1) await dialog.getByRole('button', { name: 'Next page' }).click();
      }
      const download = page.waitForEvent('download');
      await dialog.getByRole('button', { name: /^Download$/ }).click();
      expect((await download).suggestedFilename()).toBe(`odunayo-mohammed-${slug}.pdf`);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      const res = await page.request.get(`/resumes/odunayo-mohammed-${slug}.pdf`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/pdf');
      expect((await res.body()).length).toBeGreaterThan(0);
    }
  });

  test('RS-21: the hero opens the same preview; Download works from a card', async ({ page }) => {
    await openHome(page);
    await page
      .locator('#top')
      .getByRole('button', { name: /Résumé/ })
      .click();
    const dialog = dialogFor(page, 'Fullstack Software Engineer');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // From the keyboard: after the preview closes the page can still be settling (focus goes back
    // to the hero), and in WebKit a mouse click aimed a moment earlier can land beside the button.
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Mobile Developer résumé (PDF)' }).focus();
    await page.keyboard.press('Enter');
    expect((await download).suggestedFilename()).toBe('odunayo-mohammed-mobile.pdf');
  });

  test('RS-16: tabs switch without closing; a backdrop click closes; focus returns', async ({
    page,
  }) => {
    await openHome(page, '#resume');
    const preview = page.getByRole('button', { name: 'Preview Mobile Developer résumé' });
    // From the keyboard: Safari doesn't focus a button on click, so it would have no opener.
    await preview.focus();
    await page.keyboard.press('Enter');
    const tab = page.getByRole('tab', { name: 'Mobile Developer' });
    await tab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'DevOps / Cloud Engineer' })).toBeFocused();
    const dialog = dialogFor(page, 'DevOps / Cloud Engineer');
    await expect(dialog).toBeVisible();
    // The dialog element outside its panel is the backdrop.
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
    await expect(preview).toBeFocused();
  });

  test('RS-18: #resume=<slug> opens that variant; an unknown slug is ignored', async ({ page }) => {
    await openHome(page, '#resume=mobile');
    await expect(dialogFor(page, 'Mobile Developer')).toBeVisible();
    // A hash change alone doesn't reload the page: start a fresh one.
    await page.goto('about:blank');
    await openHome(page, '#resume=nope');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('"Get the résumé" beside the timeline opens the preview, not the section', async ({
    page,
  }) => {
    await openHome(page, '#experience');
    const button = page.getByRole('button', { name: 'Get the résumé' });
    await button.scrollIntoViewIfNeeded();
    const scrolled = await page.evaluate(() => scrollY);
    await button.click();
    const dialog = dialogFor(page, 'Fullstack Software Engineer');
    await expect(dialog).toBeVisible();
    // The page stayed where it was: no jump to #resume.
    expect(await page.evaluate(() => scrollY)).toBe(scrolled);
    expect(new URL(page.url()).hash).not.toBe('#resume');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('RS-24: page 2 previews load only when that page is shown', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(new URL(r.url()).pathname));
    await openHome(page, '#resume');
    expect(requested.filter((p) => p.endsWith('-page-2.webp'))).toEqual([]);
    await page.getByRole('button', { name: 'Preview Fullstack Software Engineer résumé' }).click();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect
      .poll(() => requested.includes('/resumes/odunayo-mohammed-fullstack-page-2.webp'))
      .toBe(true);
  });
});

test.describe('résumés on a phone (RS-22)', () => {
  test.skip(({ isMobile }) => !isMobile, 'the pixel and iphone projects');

  test('the preview fills the screen, zoom is allowed, and Download works', async ({ page }) => {
    await openHome(page, '#resume=fullstack');
    const dialog = dialogFor(page, 'Fullstack Software Engineer');
    await expect(dialog).toBeVisible();
    const width = await dialog.evaluate((d) => d.getBoundingClientRect().width);
    expect(width).toBeGreaterThanOrEqual(page.viewportSize()!.width * 0.9);
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/);
    const download = page.waitForEvent('download');
    await dialog.getByRole('button', { name: /^Download$/ }).click();
    expect((await download).suggestedFilename()).toBe('odunayo-mohammed-fullstack.pdf');
  });
});
