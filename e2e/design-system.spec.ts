import { expect, test } from '@playwright/test';

// The Factman tokens and fm-* classes load globally and theme the page.
test.describe('design system', () => {
  test('tokens resolve on the page in Light and Dark', async ({ page }) => {
    await page.goto('/');
    const read = () =>
      page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const body = getComputedStyle(document.body);
        return {
          canvasToken: root.getPropertyValue('--bg-canvas').trim(),
          bodyBackground: body.backgroundColor,
          bodyColor: body.color,
          font: body.fontFamily,
          colorScheme: root.colorScheme,
        };
      });

    const light = await read();
    expect(light.canvasToken).toBe('#dde5ef'); // bg-canvas → neutral-150
    expect(light.bodyBackground).toBe('rgb(221, 229, 239)'); // neutral-150 #dde5ef
    expect(light.bodyColor).toBe('rgb(7, 32, 63)'); // text-primary → blue-900 #07203f
    expect(light.font).toContain('Plus Jakarta Sans');
    expect(light.colorScheme).toBe('light');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const dark = await read();
    expect(dark.bodyBackground).toBe('rgb(7, 11, 20)'); // neutral-950 #070b14
    expect(dark.bodyColor).toBe('rgb(245, 248, 252)'); // text-primary → neutral-50 #f5f8fc
    expect(dark.colorScheme).toBe('dark');
  });

  test('fm-* component classes are available globally', async ({ page }) => {
    await page.goto('/');
    const hasRule = await page.evaluate(() =>
      [...document.styleSheets].some((sheet) =>
        [...sheet.cssRules].some(
          (rule) => rule instanceof CSSStyleRule && rule.selectorText.includes('.fm-btn'),
        ),
      ),
    );
    expect(hasRule).toBe(true);
  });
});
