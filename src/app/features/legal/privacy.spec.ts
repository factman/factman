import { DOCUMENT } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SITE } from '@core/config';
import { site } from '@data/site';
import { resolveSite } from '@shared';

import { OPEN_CONSENT_EVENT, PrivacyPage, storageItems } from './privacy';

const providers = [provideRouter([]), { provide: SITE, useValue: resolveSite(site, 'production') }];

describe('storageItems', () => {
  it('splits each stored key into its name and lifetime, with its purpose', () => {
    const items = storageItems([
      {
        label: 'necessary',
        description: 'Always on',
        storage: ['fm_consent (6 months)', 'fm_theme'],
      },
      { label: 'advertising', description: 'Not used', storage: [] },
    ]);
    expect(items).toEqual([
      {
        name: 'fm_consent',
        category: 'Necessary',
        purpose: 'Stores your cookie choice',
        lifetime: '6 months',
      },
      {
        name: 'fm_theme',
        category: 'Necessary',
        purpose: 'Remembers Light or Dark',
        lifetime: 'Until cleared',
      },
    ]);
  });
});

describe('PrivacyPage (/privacy)', () => {
  it('has the h1, the policy version and every stored key from the consent settings', async () => {
    const { container } = await render(PrivacyPage, { providers });
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy and cookies' })).toBeTruthy();
    expect(screen.getByText(`Policy version ${site.consent.version}`)).toBeTruthy();
    for (const c of site.consent.categories) {
      for (const entry of c.storage) expect(container.textContent).toContain(entry.split(' ')[0]);
    }
  });

  it('covers what is collected, the contact form and who to ask', async () => {
    await render(PrivacyPage, { providers });
    for (const name of [
      'What is collected',
      'Cookies and storage',
      'The contact form',
      'Questions and requests',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy();
    }
    const { contact } = await import('@data/contact');
    expect(screen.getByRole('link', { name: contact.email }).getAttribute('href')).toBe(
      `mailto:${contact.email}`,
    );
  });

  it('asks the consent banner to reopen from "Change cookie settings"', async () => {
    const { fixture } = await render(PrivacyPage, { providers });
    const opened = vi.fn();
    fixture.debugElement.injector.get(DOCUMENT).addEventListener(OPEN_CONSENT_EVENT, opened);
    await userEvent.click(screen.getByRole('button', { name: /cookie settings/i }));
    expect(opened).toHaveBeenCalled();
  });
});
