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

  test('only global design-system CSS loads up front; component CSS waits for its component', async ({
    page,
  }) => {
    await page.goto('/');
    const selectors = await page.evaluate(() =>
      [...document.styleSheets].flatMap((sheet) =>
        [...sheet.cssRules]
          .filter((r) => r instanceof CSSStyleRule)
          .map((r) => (r as CSSStyleRule).selectorText),
      ),
    );
    // global.css: backdrop, icons and shared tones and glass
    expect(selectors.some((s) => s.includes('.fm-backdrop'))).toBe(true);
    expect(selectors.some((s) => s.includes('.fm-glass'))).toBe(true);
    // per-component sections are not shipped to a page that doesn't render them
    expect(selectors.some((s) => s.includes('.fm-btn'))).toBe(false);
    expect(selectors.some((s) => s.includes('.fm-cal'))).toBe(false);
  });
});
