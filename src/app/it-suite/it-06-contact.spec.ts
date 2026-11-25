import { TestBed } from '@angular/core/testing';
import { ANALYTICS } from '@core/analytics';
import { ConsentService } from '@core/consent';
import { contact } from '@data/contact';
import { site } from '@data/site';
import { within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { openApp } from './it-harness';

// IT-06 (US-16): the contact form composes the mailto: URL in the browser; nothing is sent.
// contact_form_submit reaches the data layer with analytics consent, and not without it.
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

  it('fires contact_form_submit with consent, and not without it', async () => {
    type LayerWindow = Window & { dataLayer?: Record<string, unknown>[] };
    const submits = () =>
      ((window as LayerWindow).dataLayer ?? []).filter((e) => e['event'] === 'contact_form_submit');
    const send = async (page: HTMLElement) => {
      const form = within(page.querySelector<HTMLElement>('#contact form')!);
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
    };
    const on = { provide: ANALYTICS, useValue: { ...site.analytics, enabled: true } };
    for (const allowed of [false, true]) {
      document.cookie = `${site.consent.cookie}=; Max-Age=0; Path=/`;
      localStorage.clear();
      delete (window as LayerWindow).dataLayer;
      TestBed.resetTestingModule();
      const { page } = await openApp('/', [on]);
      const consent = TestBed.inject(ConsentService);
      if (allowed) consent.acceptAll();
      else consent.declineAll();
      TestBed.tick();
      await send(page);
      expect(submits(), `consent ${allowed}`).toHaveLength(allowed ? 1 : 0);
      if (allowed) {
        expect(submits()[0]).toMatchObject({ message_length_bucket: '0-49' });
        // Nothing the visitor typed reaches the data layer.
        expect(JSON.stringify((window as LayerWindow).dataLayer)).not.toMatch(
          /Ada|example\.com|pipeline/,
        );
      }
    }
    document.querySelectorAll('script#fm-gtm').forEach((s) => s.remove());
  });
});
