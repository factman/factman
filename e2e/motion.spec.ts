import { expect, test } from '@playwright/test';

// ETE-26: reveal on scroll, and reduced motion.
test('sections below the fold reveal as they scroll into view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto('/');
  const contact = page.locator('#contact .section-layout-body');
  // Scroll-driven where the browser has view timelines (.fm-reveal-scroll, ETE-269), else the
  // IntersectionObserver path (.fm-reveal, then .is-in).
  await expect(contact).toHaveClass(/fm-reveal(-scroll)?\b/);
  await expect(contact).not.toHaveClass(/is-in/);
  await expect(contact).not.toHaveCSS('opacity', '1');
  await contact.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 2000); // to the foot of the page, past the reveal range
  await expect(contact).toHaveCSS('opacity', '1');
});

test('the prerendered page is never hidden, even without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#contact .section-layout-body')).not.toHaveClass(/fm-reveal/);
  await expect(page.locator('#contact .section-layout-body')).toHaveCSS('opacity', '1');
  await context.close();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing is hidden or animated', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto('/');
    const contact = page.locator('#contact .section-layout-body');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(contact).not.toHaveClass(/fm-reveal/);
    await expect(contact).toHaveCSS('opacity', '1');
    // No global reset (ETE-259): the section simply has no animation and no transition.
    await expect(contact).toHaveCSS('animation-name', 'none');
    await expect(contact).toHaveCSS('transition-duration', '0s');
  });
});

test.describe('cards with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a hovered card does not lift (ETE-259)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover needs a mouse');
    await page.goto('/services');
    const card = page.locator('.service-card').first();
    await card.hover();
    await expect(card).toHaveCSS('transform', 'none');
  });
});

// ETE-93: the "Worked with" marquee.
test.describe('the "Worked with" strip', () => {
  test('loops, and pauses on hover', async ({ page, isMobile }) => {
    await page.goto('/');
    const track = page.locator('.client-logo-strip-track');
    await expect(track).toHaveCSS('animation-name', 'client-logo-strip-scroll');
    await expect(track).toHaveCSS('animation-play-state', 'running');
    test.skip(isMobile, 'hover needs a mouse');
    await page.locator('.client-logo-strip-viewport').hover();
    await expect(track).toHaveCSS('animation-play-state', 'paused');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('is a static grid with no copy and no pause button', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.client-logo-strip-track')).toHaveCSS('animation-name', 'none');
      await expect(page.locator('.client-logo-strip-group.is-copy')).toBeHidden();
      await expect(page.getByRole('button', { name: /logo animation/ })).toBeHidden();
      await expect(page.locator('.client-logo-strip-group').first()).toHaveCSS('flex-wrap', 'wrap');
    });
  });
});
