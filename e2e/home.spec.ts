import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

const feed = readFileSync('e2e/fixtures/medium-feed.xml', 'utf8');

// Smoke test for the home route; e2e/routes.spec.ts covers the whole site map.
test.describe('home', () => {
  test('is prerendered: the raw HTML already contains the heading', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<h1[^>]*>Odunayo Mohammed<\/h1>/);
    // The hero is in the HTML too, with the first role typed out (ETE-89).
    expect(html).toContain('id="top"');
    expect(html).toContain('Fullstack Software Engineer');
  });

  test('renders and hydrates in the browser', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Odunayo Mohammed');
    await expect(page.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('hydrates each deferred section as it scrolls into view, without errors', async ({
    page,
  }) => {
    // Stack to Contact are `@defer (hydrate on viewport)` (ETE-114); a mismatch logs NG05xx errors.
    const errors: string[] = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (error) => errors.push(error.message));
    // The blog feed is read live from Medium (blog.spec.ts mocks it the same way); images are not needed.
    await page.route('**/feeds/medium', (route) =>
      route.fulfill({ status: 200, contentType: 'text/xml', body: feed }),
    );
    await page.route('https://cdn-images-1.medium.com/**', (route) =>
      route.fulfill({ status: 204, body: '' }),
    );
    await page.goto('/');
    for (const id of ['stack', 'experience', 'services', 'projects', 'stats', 'blog', 'contact']) {
      const section = page.locator(`section#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator('.home-deferred')).toHaveCount(0);
    }
    // The contact form hydrated with its section: an empty submit shows the inline errors.
    const form = page.locator('#contact form');
    await form.getByRole('button', { name: /Compose email/ }).click();
    await expect(form.getByText('Enter your name')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a #resume=<slug> link opens that résumé's preview; Escape closes it (FR-47)", async ({
    page,
  }) => {
    await page.goto('/#resume=devops');
    const dialog = page.getByRole('dialog', { name: 'DevOps / Cloud Engineer résumé preview' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img', { name: /Page 1 of 2 of the DevOps/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('the résumé PDFs are served', async ({ request }) => {
    const res = await request.get('/resumes/odunayo-mohammed-fullstack.pdf');
    expect(res.status()).toBe(200);
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
