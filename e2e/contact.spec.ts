import { expect, test } from '@playwright/test';

// FR-27, FR-28 (ETE-103): the contact form checks the message, then drafts an email for the
// visitor's own mail app; nothing is sent from the site.
test('the contact form shows inline errors, then drafts the email with fallbacks', async ({
  page,
}) => {
  await page.goto('/#contact');
  // The form works once the app has hydrated; before that a click would submit it natively.
  await page.waitForLoadState('networkidle');
  const form = page.locator('#contact form');
  await form.getByRole('button', { name: /Compose email/ }).click();
  await expect(form.getByText('Enter your name')).toBeVisible();
  await expect(form.getByRole('textbox', { name: 'Name' })).toBeFocused();

  await form.getByRole('textbox', { name: 'Name' }).fill('Ada Lovelace');
  await form.getByRole('textbox', { name: 'Email' }).fill('ada@example.com');
  await form.getByRole('combobox', { name: 'Topic or service' }).selectOption('DevOps');
  await form
    .getByRole('textbox', { name: 'Message' })
    .fill('We need a CI/CD pipeline for our Angular apps.');
  await form.getByText(/You may contact me/).click();

  await form.getByRole('button', { name: /Compose email/ }).click();

  const ready = page.locator('#contact .contact-form-ready');
  await expect(ready).toContainText('Thanks, Ada. Talk soon!');
  await expect(ready.getByRole('link', { name: /Open mail app/ })).toHaveAttribute(
    'href',
    /^mailto:[^?]+\?subject=%5BPortfolio%5D%20DevOps%20from%20Ada%20Lovelace&body=/,
  );
  await expect(ready.getByRole('link', { name: /Open in Gmail/ })).toHaveAttribute(
    'href',
    /^https:\/\/mail\.google\.com\/mail\//,
  );
});
