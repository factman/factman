import { expect, test } from '@playwright/test';

// ETE-43: every route of the site map is prerendered (FR-01), lazy-loaded and titled.
const pages = [
  ['/', 'Odunayo Mohammed', 'Odunayo Mohammed'],
  ['/services', 'Services', 'Services · Odunayo Mohammed'],
  ['/services/consultancy', 'Consultancy', 'Consultancy · Odunayo Mohammed'],
  ['/services/devops', 'DevOps', 'DevOps · Odunayo Mohammed'],
  ['/projects', 'Projects', 'Projects · Odunayo Mohammed'],
  ['/blog', 'Blog', 'Blog · Odunayo Mohammed'],
  ['/privacy', 'Privacy', 'Privacy · Odunayo Mohammed'],
  ['/404', 'Page not found', 'Page not found · Odunayo Mohammed'],
] as const;

for (const [path, h1, title] of pages) {
  test(`${path} is prerendered with its heading and title`, async ({ request, page }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<h1>${h1}</h1>`);
    expect(html).toContain(`<title>${title}</title>`);

    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
  });
}

test('every service in services.json has a prerendered page', async ({ request }) => {
  const res = await request.get('/services');
  const links = [...(await res.text()).matchAll(/href="(\/services\/[^"]+)"/g)].map((m) => m[1]);
  expect(links).toHaveLength(8);
  for (const link of links) expect((await request.get(link)).status(), link).toBe(200);
});

test('the not-found page is never indexed', async ({ request }) => {
  const html = await (await request.get('/404')).text();
  expect(html).toContain('<meta name="robots" content="noindex">');
});

test('home sections are anchors, and /#contact scrolls to and focuses its section', async ({
  page,
}) => {
  await page.goto('/');
  for (const id of [
    'about',
    'resume',
    'stack',
    'experience',
    'services',
    'projects',
    'stats',
    'blog',
    'contact',
  ]) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
  await page.goto('/#contact');
  await expect(page.locator('section#contact')).toBeInViewport();
});

test('in-app navigation moves focus to the new page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'All services' }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();

  await page.getByRole('link', { name: 'DevOps' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'DevOps' })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
});

test('the skip link is the first tab stop and jumps to the content', async ({ page }) => {
  await page.goto('/services');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/\/services$/);
});
