import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The hero portrait (FR-50, ETE-91): responsive AVIF and WebP, a reserved box, high priority, and
// an LCP within budget on a throttled connection.
const { photo } = JSON.parse(readFileSync('src/data/profile.json', 'utf8')) as {
  photo: { src: string; alt: string; width: number; height: number };
};
const base = `/assets/${photo.src.replace(/\.[a-z]+$/, '')}`;

/** The LCP budget from ETE-91, on the throttled run below. */
const LCP_BUDGET_MS = 1800;

test.describe('hero portrait', () => {
  test('is prerendered as a picture with AVIF and WebP sources', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const picture = html.match(/<picture>[\s\S]*?profile-hero-portrait[\s\S]*?<\/picture>/)?.[0];
    expect(picture, 'no hero picture in the HTML').toBeTruthy();
    for (const format of ['avif', 'webp']) {
      expect(picture).toContain(`type="image/${format}"`);
      expect(picture).toMatch(new RegExp(`${base}-\\d+\\.${format} \\d+w`));
    }
    const img = picture!.match(/<img[^>]*>/)![0];
    expect(img).toContain(`width="${photo.width}"`);
    expect(img).toContain(`height="${photo.height}"`);
    expect(img).toContain(`alt="${photo.alt}"`);
    expect(img).toContain('fetchpriority="high"');
    expect(img).toContain('loading="eager"');
  });

  test('loads one of its exports, not the full-size source', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('img.profile-hero-portrait');
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete)).toBe(true);
    const current = await img.evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname);
    expect(current).toMatch(new RegExp(`^${base}-\\d+\\.(avif|webp)$`));
  });

  test(`paints the largest content within ${LCP_BUDGET_MS} ms on slow 4G`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'throttling and LCP need Chromium');
    // Lighthouse's mobile slow 4G: 150 ms round trip, 1.6 Mbps down, 750 kbps up, 4x slower CPU.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto('/', { waitUntil: 'load' });
    const lcp = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const last = list.getEntries().at(-1);
            if (last) resolve(last.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
    );
    expect(lcp).toBeLessThanOrEqual(LCP_BUDGET_MS);
  });
});
