import { contact } from '@data/contact';
import { within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { openApp } from './it-harness';

// IT-06 (US-16): the contact form composes the mailto: URL in the browser; nothing is sent.
// The contact_form_submit event with and without consent waits for analytics (milestone 4).
describe('IT-06 Contact submit composes the mailto: URL', () => {
  it('shows the inline errors, then a mailto: to contact.json with the encoded message', async () => {
    const { page, settle } = await openApp('/');
    const form = within(page.querySelector<HTMLElement>('#contact form')!);
    await userEvent.click(form.getByRole('button', { name: /Compose email/ }));
    expect(form.getByText('Enter your name')).toBeTruthy();

    await userEvent.type(form.getByRole('textbox', { name: 'Name' }), 'Ada Lovelace');
    await userEvent.type(form.getByRole('textbox', { name: 'Email' }), 'ada@example.com');
    await userEvent.selectOptions(
      form.getByRole('combobox', { name: 'Topic or service' }),
      'DevOps',
    );
    await userEvent.type(
      form.getByRole('textbox', { name: 'Message' }),
      'We need a CI/CD pipeline & a review.',
    );
    await userEvent.click(form.getByText(/You may contact me/));
    await userEvent.click(form.getByRole('button', { name: /Compose email/ }));
    await settle();

    const ready = within(page.querySelector<HTMLElement>('#contact .contact-form-ready')!);
    const href = ready.getByRole('link', { name: /Open mail app/ }).getAttribute('href')!;
    expect(href.startsWith(`mailto:${contact.email}?subject=`)).toBe(true);
    const body = new URL(href).searchParams.get('body')!;
    expect(body).toContain('We need a CI/CD pipeline & a review.');
    expect(body).toContain('ada@example.com');
  });

  it('lists every way to reach Odunayo beside the form (US-15)', async () => {
    const { page } = await openApp('/');
    const section = page.querySelector('#contact')!;
    const hrefs = [...section.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
    expect(hrefs).toContain(`mailto:${contact.email}`);
    expect(hrefs.some((h) => h.startsWith('https://wa.me/'))).toBe(true);
    for (const id of ['github', 'linkedin', 'x', 'medium']) {
      const link = contact.links.find((l) => l.id === id);
      if (link) expect(hrefs, id).toContain(link.url);
    }
    // City and country only, never a street address.
    expect(section.textContent).toContain(`${contact.city}, ${contact.country}`);
  });

  it.todo('fires contact_form_submit with consent, and not without it (analytics, ETE-120 on)');
});
