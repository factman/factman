import { importProvidersFrom } from '@angular/core';
import { DeferBlockBehavior } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoreModule } from '@core';
import { ConsentService, OPEN_CONSENT_EVENT } from '@core/consent';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ConsentHost } from './consent-host';
import { ANALYTICS_TRACKER } from '@shared';

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

const banner = () => document.querySelector<HTMLElement>('.consent-dock');
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
    await userEvent.click(
      await screen.findByRole('button', { name: 'Accept all' }, { timeout: 2000 }),
    );
    await fixture.whenStable();
    expect(consent.status()).toBe('accepted');
    expect(isOpen()).toBe(false);
  });

  it('stores Accept necessary', async () => {
    const { consent, fixture } = await renderHost();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Accept necessary' }, { timeout: 2000 }),
    );
    await fixture.whenStable();
    expect(consent.status()).toBe('declined');
    expect(consent.granted('analytics')).toBe(false);
  });

  it('closes on Esc without deciding', async () => {
    const { consent, fixture } = await renderHost();
    screen.getByRole('dialog', { hidden: true }).focus();
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

describe('ConsentHost analytics (FR-35)', () => {
  beforeEach(clear);

  it('records the decision as consent_update from the prompt', async () => {
    const track = vi.fn();
    const view = await render(ConsentHost, {
      providers: [
        provideRouter([]),
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
        { provide: ANALYTICS_TRACKER, useValue: { track } },
      ],
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    });
    await view.fixture.whenStable();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Accept all' }, { timeout: 2000 }),
    );
    expect(track).toHaveBeenCalledWith('consent_update', { analytics: true, source: 'prompt' });
  });
});
