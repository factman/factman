import { Component, importProvidersFrom, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ANALYTICS_TRACKER } from '@shared';

import { CoreModule } from '../core.module';
import { ConsentService } from '../consent/consent.service';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS } from './analytics.token';
import { clearAnalyticsCookies, gtag, pageLocation } from './gtm';

type LayerWindow = Window & { dataLayer?: unknown[] } & Record<string, unknown>;
const win = window as unknown as LayerWindow;
const layer = () => win.dataLayer ?? [];
/** The data layer's events (`{ event, … }`), leaving out gtag commands. */
const events = () =>
  layer().filter((e): e is Record<string, unknown> => !!e && !('length' in (e as object)));
/** The gtag commands queued, as plain arrays. */
const commands = () =>
  layer()
    .filter((e) => !!e && typeof e === 'object' && 'length' in e)
    .map((e) => Array.from(e as ArrayLike<unknown>));
const gtmScripts = () => document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');

@Component({ template: '' })
class Page {}

const ON = { enabled: true, gtmId: 'GTM-TEST1', ga4Id: 'G-TEST1' };

const setup = (
  analytics: { enabled: boolean; gtmId: string | null; ga4Id: string | null } = ON,
  platform = 'browser',
) => {
  TestBed.configureTestingModule({
    providers: [
      importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      provideRouter([{ path: '**', component: Page }]),
      { provide: ANALYTICS, useValue: analytics },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  const consent = TestBed.inject(ConsentService);
  const service = TestBed.inject(AnalyticsService);
  TestBed.tick();
  return { analytics: service, consent, router: TestBed.inject(Router) };
};

/** Decides, then lets the consent effect run. */
const decide = (consent: ConsentService, choice: 'acceptAll' | 'declineAll') => {
  consent[choice]();
  TestBed.tick();
};

describe('AnalyticsService', () => {
  beforeEach(() => {
    document.cookie = 'fm_consent=; Max-Age=0; Path=/';
    localStorage.clear();
    delete win.dataLayer;
    delete win['ga-disable-G-TEST1'];
    document.querySelectorAll('script#fm-gtm').forEach((s) => s.remove());
  });

  it('is the tracker components send to', () => {
    const { analytics } = setup();
    expect(TestBed.inject(ANALYTICS_TRACKER)).toBe(analytics);
  });

  it('turns analytics off in dev mode (ng serve)', () => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(CoreModule.forRoot({ environment: 'production' }))],
    });
    expect(TestBed.inject(ANALYTICS).enabled).toBe(false);
  });

  describe('before consent', () => {
    it('loads nothing and sends nothing before a decision', () => {
      const { analytics } = setup();
      analytics.track('resume_download', { resume_id: 'fullstack', source: 'card' });
      expect(analytics.active).toBe(false);
      expect(gtmScripts()).toHaveLength(0);
      expect(layer()).toEqual([]);
    });

    it('loads nothing after Accept necessary', () => {
      const { analytics, consent } = setup();
      decide(consent, 'declineAll');
      analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
      expect(gtmScripts()).toHaveLength(0);
      expect(layer()).toEqual([]);
    });
  });

  describe('after Accept all', () => {
    it('queues the consent state, then loads GTM once', () => {
      const { consent } = setup();
      decide(consent, 'acceptAll');
      decide(consent, 'acceptAll');
      expect(gtmScripts()).toHaveLength(1);
      expect((gtmScripts()[0] as HTMLScriptElement).src).toBe(
        'https://www.googletagmanager.com/gtm.js?id=GTM-TEST1',
      );
      expect((gtmScripts()[0] as HTMLScriptElement).async).toBe(true);
      expect(commands()[0]).toEqual([
        'consent',
        'default',
        {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        },
      ]);
      expect(events()[0]).toMatchObject({ event: 'gtm.js' });
      expect(win['ga-disable-G-TEST1']).toBe(false);
    });

    it('loads GTM on the first page for a visitor who allowed it before', () => {
      setup().consent.acceptAll();
      TestBed.resetTestingModule();
      delete win.dataLayer;
      setup();
      expect(gtmScripts()).toHaveLength(1);
    });

    it('sends each page once, with its path only: no fragment or query', async () => {
      const { consent, router } = setup();
      decide(consent, 'acceptAll');
      const go = async (url: string) => {
        await router.navigateByUrl(url);
        TestBed.tick();
      };
      await go('/projects?q=me@example.com#resume=fullstack');
      await go('/projects#about');
      await go('/services');
      const views = events().filter((e) => e['event'] === 'page_view');
      expect(views.map((v) => v['page_path'])).toEqual(['/', '/projects', '/services']);
      expect(views[1]).toEqual({
        event: 'page_view',
        page_location: `${location.origin}/projects`,
        page_path: '/projects',
        page_title: document.title,
      });
    });

    it('pushes { event, ...params } for the catalogue', () => {
      const { analytics, consent } = setup();
      decide(consent, 'acceptAll');
      analytics.track('resume_download', { resume_id: 'fullstack', source: 'card' });
      expect(events().at(-1)).toEqual({
        event: 'resume_download',
        resume_id: 'fullstack',
        source: 'card',
      });
    });

    it('queues the consent state before an event sent right after the decision', () => {
      const { analytics, consent } = setup();
      consent.acceptAll();
      analytics.track('consent_update', { analytics: true, source: 'prompt' });
      expect(commands()[0]?.[0]).toBe('consent');
      expect(gtmScripts()).toHaveLength(1);
    });

    it('drops events whose parameters look like personal data', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { analytics, consent } = setup();
      decide(consent, 'acceptAll');
      const before = layer().length;
      analytics.track('filter_used', { scope: 'blog', value: 'me@example.com' });
      expect(layer()).toHaveLength(before);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"value"'));
      warn.mockRestore();
    });
  });

  describe('withdrawing consent', () => {
    it('updates consent to denied, switches GA4 off, deletes its cookies and stops events', () => {
      const { analytics, consent } = setup();
      decide(consent, 'acceptAll');
      document.cookie = '_ga=GA1.1.1; Path=/';
      document.cookie = '_ga_TEST1=GS1.1; Path=/';
      decide(consent, 'declineAll');

      expect(commands().at(-1)).toEqual([
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'denied' }),
      ]);
      expect(win['ga-disable-G-TEST1']).toBe(true);
      expect(document.cookie).not.toMatch(/_ga/);
      const before = layer().length;
      analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
      expect(layer()).toHaveLength(before);
    });

    it('turns it back on when allowed again in the same page view, without a second GTM', () => {
      const { consent } = setup();
      decide(consent, 'acceptAll');
      decide(consent, 'declineAll');
      decide(consent, 'acceptAll');
      expect(commands().at(-1)).toEqual([
        'consent',
        'update',
        expect.objectContaining({ analytics_storage: 'granted' }),
      ]);
      expect(win['ga-disable-G-TEST1']).toBe(false);
      expect(gtmScripts()).toHaveLength(1);
    });

    it("deletes GA's cookies left from an earlier visit", () => {
      document.cookie = '_ga=GA1.1.1; Path=/';
      const { consent } = setup();
      decide(consent, 'declineAll');
      expect(document.cookie).not.toMatch(/_ga/);
    });
  });

  describe('switched off', () => {
    it('on preview builds, even with consent', () => {
      const { analytics, consent } = setup({ ...ON, enabled: false });
      decide(consent, 'acceptAll');
      analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
      expect(gtmScripts()).toHaveLength(0);
      expect(layer()).toEqual([]);
    });

    it('on the server', () => {
      const { analytics, consent } = setup(ON, 'server');
      decide(consent, 'acceptAll');
      analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
      expect(gtmScripts()).toHaveLength(0);
      expect(layer()).toEqual([]);
    });

    it('without a GTM container ID: events reach the data layer, no script loads', () => {
      const { analytics, consent } = setup({ ...ON, gtmId: null });
      decide(consent, 'acceptAll');
      analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
      expect(gtmScripts()).toHaveLength(0);
      expect(events()).toEqual([{ event: 'cta_click', cta_id: 'book', location: 'hero' }]);
    });
  });
});

describe('gtm helpers', () => {
  it('queues gtag commands as arguments objects, as GTM expects', () => {
    delete win.dataLayer;
    gtag(win as never, 'consent', 'update', { analytics_storage: 'denied' });
    expect(Array.isArray(layer()[0])).toBe(false);
    expect(Object.prototype.toString.call(layer()[0])).toBe('[object Arguments]');
  });

  it('keeps only the origin and path of a page', () => {
    expect(pageLocation('https://factman.dev/projects/x?ref=a#resume=fullstack')).toEqual({
      page_location: 'https://factman.dev/projects/x',
      page_path: '/projects/x',
    });
  });

  it('deletes only GA cookies', () => {
    document.cookie = '_ga=1; Path=/';
    document.cookie = '_gid=1; Path=/';
    document.cookie = 'fm_theme=dark; Path=/';
    clearAnalyticsCookies(document);
    expect(document.cookie).not.toMatch(/_ga|_gid/);
    expect(document.cookie).toContain('fm_theme=dark');
    document.cookie = 'fm_theme=; Max-Age=0; Path=/';
  });
});
