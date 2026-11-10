import { expect, test } from '@playwright/test';

// ETE-26: reveal on scroll, and reduced motion.
test('sections below the fold reveal as they scroll into view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto('/');
  const contact = page.locator('section#contact');
  await expect(contact).toHaveClass(/fm-reveal/);
  await expect(contact).not.toHaveClass(/is-in/);
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toHaveClass(/is-in/);
  await expect(contact).toHaveCSS('opacity', '1');
});

test('the prerendered page is never hidden, even without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('section#contact')).not.toHaveClass(/fm-reveal/);
  await expect(page.locator('section#contact')).toHaveCSS('opacity', '1');
  await context.close();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing is hidden or animated', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto('/');
    const contact = page.locator('section#contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(contact).not.toHaveClass(/fm-reveal/);
    await expect(contact).toHaveCSS('opacity', '1');
    const durations = await contact.evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.transitionDuration, s.animationDuration];
    });
    for (const d of durations) expect(parseFloat(d)).toBeLessThan(0.001);
  });
});
