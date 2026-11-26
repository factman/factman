import { expect, type Page, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// ETE-32: the blog is read live from Medium in the browser and cached for 12 hours. The feed and
// the Medium image CDN are mocked here; vercel.json rewrites /feeds/medium to Medium in production.
const feed = readFileSync('e2e/fixtures/medium-feed.xml', 'utf8');
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; has?: unknown[]; headers: { key: string; value: string }[] }[];
};
const csp = (
  vercel.headers
    .find((h) => h.source === '/((?!(?:storybook|coverage|playwright)(?:/|$)).*)' && h.has)
    ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
).replace('upgrade-insecure-requests', '');
// A 1×1 transparent PNG.
const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function mock(page: Page, feedStatus = 200) {
  const requests = { feed: 0 };
  await page.route('**/feeds/medium', async (route) => {
    requests.feed++;
    await route.fulfill({ status: feedStatus, contentType: 'text/xml', body: feed });
  });
  await page.route('https://cdn-images-1.medium.com/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: pixel }),
  );
  return requests;
}

test('/blog lists the Medium articles with live Medium covers, under the production CSP', async ({
  page,
}) => {
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (/Content[- ]Security[- ]Policy|CSP/i.test(msg.text())) violations.push(msg.text());
  });
  await page.route(/\/blog$/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': csp },
    });
  });
  await mock(page);

  await page.goto('/blog');
  const articles = page.getByRole('link', { name: 'Typed APIs & You: A Field Guide' });
  await expect(articles).toBeVisible();
  await expect(articles).toHaveAttribute(
    'href',
    'https://medium.com/@sample/typed-apis-you-a-field-guide-0a1b2c3d4e5f',
  );
  await expect(page.getByRole('link', { name: 'Short note' })).toBeVisible();
  // The first article's cover (the hero's portrait comes before the list).
  await expect(page.locator('.blog-all img').first()).toHaveAttribute(
    'src',
    'https://cdn-images-1.medium.com/max/1024/1*sample-cover.png',
  );
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  expect(violations).toEqual([]);
});

test('a reload within 12 hours reads the cache instead of Medium', async ({ page }) => {
  const requests = await mock(page);
  await page.goto('/blog');
  await expect(page.getByRole('link', { name: 'Short note' })).toBeVisible();
  expect(requests.feed).toBe(1);

  await page.reload();
  await expect(page.getByRole('link', { name: 'Short note' })).toBeVisible();
  expect(requests.feed).toBe(1);
});

test('when Medium is unreachable and nothing is cached, readers get a link to Medium', async ({
  page,
}) => {
  await mock(page, 503);
  await page.goto('/blog');
  const alert = page.getByRole('alert');
  await expect(alert).toContainText("Articles couldn't load right now.");
  await expect(alert.getByRole('link', { name: /Medium/ })).toHaveAttribute(
    'href',
    'https://medium.com/@factman60',
  );
  await expect(alert.getByRole('button', { name: /Try again/ })).toBeVisible();
});
