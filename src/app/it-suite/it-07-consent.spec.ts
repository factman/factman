import { TestBed } from '@angular/core/testing';
import { ANALYTICS } from '@core/analytics';
import { ConsentService } from '@core/consent';
import { site } from '@data/site';

import { openApp } from './it-harness';

// IT-07 (US-17, US-18, US-19): Accept injects GTM and pushes page_view; Reject injects nothing.
// Analytics is on as in the production build (tests run in dev mode, where it is off). The
// banner itself is covered by e2e/consent.spec.ts; here the decision goes through ConsentService.
type LayerWindow = Window & { dataLayer?: unknown[] };
const ON = { provide: ANALYTICS, useValue: { ...site.analytics, enabled: true } };
const gtm = () => document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
const events = () =>
  ((window as LayerWindow).dataLayer ?? []).filter(
    (e): e is Record<string, unknown> => !!e && typeof e === 'object' && !('length' in e),
  );

describe('IT-07 Accept injects GTM and pushes page_view; Reject injects nothing', () => {
  beforeEach(() => {
    document.cookie = `${site.consent.cookie}=; Max-Age=0; Path=/`;
    localStorage.clear();
    delete (window as LayerWindow).dataLayer;
    gtm().forEach((s) => s.remove());
  });

  it('Accept all injects GTM and pushes page_view', async () => {
    const { go } = await openApp('/services', [ON]);
    expect(gtm()).toHaveLength(0);
    TestBed.inject(ConsentService).acceptAll();
    TestBed.tick();
    expect(gtm()).toHaveLength(1);
    expect((gtm()[0] as HTMLScriptElement).src).toBe(
      `https://www.googletagmanager.com/gtm.js?id=${site.analytics.gtmId}`,
    );
    await go('/projects');
    const views = events().filter((e) => e['event'] === 'page_view');
    expect(views.at(-1)).toMatchObject({ page_path: '/projects' });
  });

  it('Reject all injects no script and sets no analytics cookie', async () => {
    await openApp('/services', [ON]);
    TestBed.inject(ConsentService).declineAll();
    TestBed.tick();
    expect(gtm()).toHaveLength(0);
    expect((window as LayerWindow).dataLayer ?? []).toEqual([]);
    expect(document.cookie).not.toMatch(/(^|;\s*)_ga/);
  });
});
