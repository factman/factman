import { expect, test } from '@playwright/test';

// ETE-260: in forced-colors mode (Windows High Contrast) the browser drops box-shadows and our
// colours, so focus and selection must show through outlines, borders and system colours.
test.describe('forced colours', () => {
  test.use({ forcedColors: 'active' });
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'forced colours emulation is Chromium only',
  );

  test('a keyboard-focused filter chip shows a ring, and a selected chip stands out', async ({
    page,
  }) => {
    await page.goto('/projects');
    const chips = page.locator('.project-gallery-filters .fm-chip');
    const first = chips.first().locator('button').first();
    await page.keyboard.press('Tab');
    await first.focus();
    await expect(first).toHaveCSS('outline-style', 'solid');

    const background = (i: number) =>
      chips.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await background(1);
    await chips.nth(0).locator('button').first().click();
    await expect(chips.nth(0)).toHaveClass(/is-selected/);
    expect(await background(0)).not.toBe(before);
  });

  test('the selected résumé tab is marked with a border, not a fill', async ({ page }) => {
    await page.goto('/#resume=fullstack');
    const tab = page.getByRole('tab', { selected: true });
    await expect(tab).toBeVisible();
    const marker = await tab.evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { style: s.borderTopStyle, width: s.borderTopWidth };
    });
    expect(marker.style).toBe('solid');
    expect(parseFloat(marker.width)).toBeGreaterThan(0);
  });
});
