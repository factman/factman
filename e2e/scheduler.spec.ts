import { expect, test } from '@playwright/test';

// FR-19 (ETE-98): every "Schedule a call" opens the one SchedulerModal, which frames the Google
// Calendar appointment schedule (the CSP's only frame source). Google itself is not loaded here:
// requests to it are answered locally so the test never depends on the network.
test.beforeEach(async ({ page }) => {
  await page.route('https://calendar.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Calendar</p>' }),
  );
});

for (const path of ['/services', '/services/devops']) {
  test(`"Schedule a call" on ${path} opens the scheduler, and Escape closes it`, async ({
    page,
  }) => {
    await page.goto(path);
    const opener = page.getByRole('button', { name: /Schedule a call/ }).first();
    // From the keyboard: WebKit doesn't focus a button on a mouse click, so focus return is
    // checked the way keyboard users meet it.
    await opener.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Schedule a call' });
    await expect(dialog).toBeVisible();
    const frame = dialog.locator('iframe');
    await expect(frame).toHaveAttribute(
      'src',
      /^https:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\//,
    );
    await expect(dialog.getByRole('link', { name: /Open in a new tab/ })).toHaveAttribute(
      'target',
      '_blank',
    );

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}

test('the services page offers email, WhatsApp and a phone call', async ({ page }) => {
  await page.goto('/services');
  const book = page.getByRole('region', { name: 'Pick the channel that suits you' });
  await expect(book.getByRole('link', { name: /Email/ })).toHaveAttribute('href', /^mailto:/);
  await expect(book.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\//,
  );
  await expect(book.getByRole('link', { name: /Phone call/ })).toHaveAttribute('href', /^tel:\+/);
});
