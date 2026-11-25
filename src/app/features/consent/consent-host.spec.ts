import { importProvidersFrom } from '@angular/core';
import { DeferBlockBehavior } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoreModule } from '@core';
import { ConsentService, OPEN_CONSENT_EVENT } from '@core/consent';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ConsentHost } from './consent-host';

const clear = () => {
  document.cookie = 'fm_consent=; Max-Age=0; Path=/';
  localStorage.clear();
};

const renderHost = async () => {
  const view = await render(ConsentHost, {
    providers: [
      provideRouter([]),
      importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
    ],
    deferBlockBehavior: DeferBlockBehavior.Playthrough,
  });
  await view.fixture.whenStable();
  return { ...view, consent: view.fixture.debugElement.injector.get(ConsentService) };
};

const banner = () => document.querySelector<HTMLElement>('.consent-banner');
/** Shown as a popover, or (without the Popover API, as in jsdom) not hidden. */
const isOpen = () => {
  const el = banner();
  if (!el) return false;
  try {
    if (el.matches(':popover-open')) return true;
  } catch {
    // no :popover-open in this DOM
  }
  return !el.hidden && !el.hasAttribute('popover');
};

describe('ConsentHost', () => {
  beforeEach(clear);
  afterEach(clear);

  it('opens on a first visit and stores Accept all', async () => {
    const { consent, fixture } = await renderHost();
    expect(isOpen()).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: /Accept all/ }));
    await fixture.whenStable();
    expect(consent.status()).toBe('accepted');
    expect(isOpen()).toBe(false);
  });

  it('stores Reject all', async () => {
    const { consent, fixture } = await renderHost();
    await userEvent.click(screen.getByRole('button', { name: /Reject all/ }));
    await fixture.whenStable();
    expect(consent.status()).toBe('declined');
    expect(consent.granted('analytics')).toBe(false);
  });

  it('closes on Esc without deciding', async () => {
    const { consent, fixture } = await renderHost();
    screen.getByRole('button', { name: /Accept all/ }).focus();
    await userEvent.keyboard('{Escape}');
    await fixture.whenStable();
    expect(isOpen()).toBe(false);
    expect(consent.status()).toBe('unset');
    expect(consent.granted('analytics')).toBe(false);
  });

  it('stays closed once decided, and reopens on request', async () => {
    const { consent, fixture } = await renderHost();
    consent.declineAll();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(isOpen()).toBe(false);

    document.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(isOpen()).toBe(true);
  });
});
