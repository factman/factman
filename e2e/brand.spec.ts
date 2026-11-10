import { expect, test } from '@playwright/test';

// ETE-25: favicon set, apple-touch icon and web manifest, all served from our origin.
test('the page links the brand icons and the manifest, and each one is served', async ({
  page,
  request,
}) => {
  await page.goto('/');

  const hrefs = await page.evaluate(() =>
    ['link[rel="icon"]', 'link[rel="apple-touch-icon"]', 'link[rel="manifest"]'].map((sel) =>
      document.querySelector<HTMLLinkElement>(sel)?.getAttribute('href'),
    ),
  );
  expect(hrefs).toEqual(['/favicon.ico', '/apple-touch-icon.png', '/site.webmanifest']);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#07203f');

  for (const href of hrefs) expect((await request.get(href!)).ok(), href!).toBe(true);

  const manifest = (await (await request.get('/site.webmanifest')).json()) as {
    name: string;
    icons: { src: string; sizes: string }[];
  };
  expect(manifest.name).toBe('Odunayo Mohammed');
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src);
    expect(res.ok(), icon.src).toBe(true);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test('the logo artwork is served for both themes', async ({ request }) => {
  for (const theme of ['light', 'dark']) {
    for (const file of [`ay-mark-${theme}-256.webp`, `odunayo-lockup-${theme}-192.webp`]) {
      const res = await request.get(`/assets/brand/${file}`);
      expect(res.ok(), file).toBe(true);
    }
  }
});
