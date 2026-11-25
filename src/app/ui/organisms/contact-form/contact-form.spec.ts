import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ContactForm } from './contact-form';
import { ANALYTICS_TRACKER } from '@shared';

const topics = ['General enquiry', 'DevOps', 'Mobile development'];

async function renderForm() {
  const composed = vi.fn();
  const result = await render(ContactForm, {
    inputs: { email: 'factman60@gmail.com', topics },
    on: { composed },
    providers: [provideRouter([])],
  });
  return { ...result, composed };
}

async function fill() {
  await userEvent.type(screen.getByLabelText(/^Name/), 'Ada Lovelace');
  await userEvent.type(screen.getByLabelText(/^Email/), 'ada@example.com');
  await userEvent.selectOptions(screen.getByLabelText(/^Topic or service/), 'DevOps');
  await userEvent.type(
    screen.getByLabelText(/^Message/),
    'We need a CI/CD pipeline for our Angular and Node.js apps.',
  );
  await userEvent.click(screen.getByLabelText(/You may contact me/));
}

describe('ContactForm', () => {
  it('shows no errors until the visitor tries to send', async () => {
    await renderForm();
    expect(screen.queryByText('Enter your name')).toBeNull();
  });

  it('shows an inline error for each problem and focuses the first', async () => {
    const { composed } = await renderForm();
    await userEvent.click(screen.getByRole('button', { name: /Compose email/ }));
    expect(screen.getByText('Enter your name')).toBeTruthy();
    expect(screen.getByText(/valid email address/)).toBeTruthy();
    expect(screen.getByText('Choose a topic or service')).toBeTruthy();
    expect(screen.getByText(/at least 20 characters/)).toBeTruthy();
    expect(screen.getByText(/Agree to be contacted/)).toBeTruthy();
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement).toBe(screen.getByLabelText(/^Name/));
    expect(composed).not.toHaveBeenCalled();
  });

  it('drafts the email and shows it ready, with the fallbacks', async () => {
    const { composed } = await renderForm();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: /Compose email/ }));

    expect(composed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Thanks, Ada. Talk soon!')).toBeTruthy();
    expect(screen.getByText('[Portfolio] DevOps from Ada Lovelace')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open mail app/ }).getAttribute('href')).toMatch(
      /^mailto:factman60@gmail\.com\?subject=/,
    );
    expect(screen.getByRole('link', { name: /Open in Gmail/ }).getAttribute('target')).toBe(
      '_blank',
    );
    expect(screen.getByRole('button', { name: /Copy message/ })).toBeTruthy();
  });

  it('goes back to the filled-in form with "Edit message"', async () => {
    await renderForm();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: /Compose email/ }));
    await userEvent.click(screen.getByRole('button', { name: /Edit message/ }));
    expect((screen.getByLabelText(/^Name/) as HTMLInputElement).value).toBe('Ada Lovelace');
  });
});

describe('ContactForm analytics (FR-35)', () => {
  it('sends contact_form_start once and contact_form_submit without personal data', async () => {
    const track = vi.fn();
    await render(ContactForm, {
      inputs: { email: 'factman60@gmail.com', topics },
      providers: [provideRouter([]), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    await fill();
    expect(track.mock.calls.filter(([name]) => name === 'contact_form_start')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /Compose email/ }));
    expect(track).toHaveBeenCalledWith('contact_form_submit', {
      topic: 'DevOps',
      has_service: false,
      message_length_bucket: '50-199',
    });
    const sent = JSON.stringify(track.mock.calls);
    expect(sent).not.toContain('Ada');
    expect(sent).not.toContain('ada@example.com');
    expect(sent).not.toContain('CI/CD pipeline');
  });
});
