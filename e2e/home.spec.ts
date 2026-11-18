import { expect, test } from '@playwright/test';

// Smoke test for the home route; e2e/routes.spec.ts covers the whole site map.
test.describe('home', () => {
  test('is prerendered: the raw HTML already contains the heading', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('<h1>Odunayo Mohammed</h1>');
  });

  test('renders and hydrates in the browser', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Odunayo Mohammed');
    await expect(page.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });
});
