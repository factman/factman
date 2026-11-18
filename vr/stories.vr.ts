import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

/** Story ids from the built Storybook's index, for the levels the UI kit covers. */
interface IndexEntry {
  id: string;
  title: string;
  type: string;
}

const INDEX = 'dist/factman/browser/storybook/index.json';
const LEVELS = /^(Atoms|Molecules|Templates)\//;

const stories = Object.values(
  (JSON.parse(readFileSync(INDEX, 'utf8')) as { entries: Record<string, IndexEntry> }).entries,
)
  .filter((e) => e.type === 'story' && LEVELS.test(e.title))
  .map((e) => e.id)
  .sort();

for (const theme of ['light', 'dark'] as const) {
  test.describe(theme, () => {
    for (const id of stories) {
      test(id, async ({ page }) => {
        // `iframe`, not `iframe.html`: the static server's clean-URL redirect would drop the query.
        await page.goto(`/storybook/iframe?id=${id}&viewMode=story&globals=theme:${theme}`);
        const root = page.locator('#storybook-root');
        // Rendered means the root has an element: toBeEmpty() also fails stories without text
        // (icons, images, inputs, skeletons).
        await expect(root.locator(':scope > *').first()).toBeAttached();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState('networkidle');
        await expect(root).toHaveScreenshot(`${id}--${theme}.png`);
      });
    }
  });
}
