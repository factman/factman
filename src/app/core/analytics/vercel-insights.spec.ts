import { importProvidersFrom, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { BeforeSendEvent } from '@vercel/analytics';

import { CoreModule } from '../core.module';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS } from './analytics.token';
import { actionUrl, redactUrl, VERCEL_INSIGHTS_SCRIPT, VercelInsights } from './vercel-insights';

type VaWindow = Window & {
  va?: (event: string, props?: unknown) => void;
  vaq?: unknown[];
  vai?: boolean;
  vam?: string;
  dataLayer?: unknown[];
};
const win = window as VaWindow;
const scripts = () => document.head.querySelectorAll(`script[src*="${VERCEL_INSIGHTS_SCRIPT}"]`);

const ON = { enabled: true, gtmId: 'GTM-TEST1', ga4Id: 'G-TEST1' };

const setup = (analytics = ON, platform = 'browser') => {
  TestBed.configureTestingModule({
    providers: [
      importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
      { provide: ANALYTICS, useValue: analytics },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return TestBed.inject(VercelInsights);
};

/**
 * Stands in for Vercel's loaded script: keeps the `beforeSend` it is given, and sends a page view
 * of the current URL through it, as the real script does, returning what would be sent.
 */
function loadedScript() {
  let beforeSend: ((e: BeforeSendEvent) => BeforeSendEvent | null) | undefined;
  const sent: (string | null)[] = [];
  win.vai = true;
  win.va = (event, props) => {
    if (event === 'beforeSend') beforeSend = props as typeof beforeSend;
    if (event === 'pageview') {
      const out = beforeSend?.({ type: 'pageview', url: location.href }) ?? null;
      sent.push(out?.url ?? null);
    }
  };
  return {
    sent,
    view: (url: string) => beforeSend?.({ type: 'pageview', url })?.url ?? null,
  };
}

describe('VercelInsights', () => {
  // The script starts once the browser is idle (ETE-126); here, at once.
  beforeEach(() =>
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
      cb();
      return 0;
    }),
  );
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    scripts().forEach((s) => s.remove());
    delete win.va;
    delete win.vaq;
    delete win.vai;
    delete win.vam;
    delete win.dataLayer;
    document.cookie = 'fm_consent=; Max-Age=0; Path=/';
    localStorage.clear();
  });

  it('adds the insights script once, deferred, and sets up the queue in production mode', () => {
    setup();
    TestBed.inject(AnalyticsService);
    expect(scripts()).toHaveLength(1);
    const script = scripts()[0] as HTMLScriptElement;
    expect(script.getAttribute('src')).toBe('/_vercel/insights/script.js');
    expect(script.defer).toBe(true);
    expect(script.dataset['sdkn']).toBe('@vercel/analytics/angular');
    expect(win.vam).toBe('production');
    expect(win.vaq?.[0]).toEqual(['beforeSend', expect.any(Function)]);
  });

  it('runs without consent: nothing to accept, no cookie or storage', () => {
    setup();
    expect(scripts()).toHaveLength(1);
    expect(document.cookie).not.toMatch(/fm_consent/);
  });

  it('is off on preview builds and on the server', () => {
    setup({ ...ON, enabled: false });
    expect(scripts()).toHaveLength(0);
    expect(win.va).toBeUndefined();
    TestBed.resetTestingModule();
    setup(ON, 'server');
    expect(scripts()).toHaveLength(0);
  });

  it('sends page views with origin, path and campaign tags only', () => {
    const script = loadedScript();
    setup();
    expect(script.view('https://factman.dev/projects?q=me@example.com#resume=fullstack')).toBe(
      'https://factman.dev/projects',
    );
    expect(script.view('https://factman.dev/?utm_source=linkedin&ref=x&utm_campaign=launch')).toBe(
      'https://factman.dev/?utm_source=linkedin&utm_campaign=launch',
    );
  });

  describe('key actions as virtual page views', () => {
    it('sends a key action on /_action/<event> with the page and its parameters', () => {
      const script = loadedScript();
      setup().action('resume_download', { resume_id: 'fullstack', source: 'card' });
      expect(script.sent).toEqual([
        `${location.origin}/_action/resume_download?page=%2F&resume_id=fullstack&source=card`,
      ]);
    });

    it('leaves other events out (they would use up the monthly events)', () => {
      const script = loadedScript();
      setup().action('theme_toggle', { theme: 'dark' });
      expect(script.sent).toEqual([]);
    });

    it('sends nothing before the script has loaded, so no page is counted twice', () => {
      const insights = setup();
      const queued = win.vaq?.length;
      insights.action('resume_download', { resume_id: 'fullstack', source: 'card' });
      expect(win.vaq).toHaveLength(queued!);
    });

    it('gets key actions from the tracker without analytics consent; GA gets nothing', () => {
      const script = loadedScript();
      setup();
      TestBed.inject(AnalyticsService).track('contact_click', { channel: 'email' });
      expect(script.sent).toEqual([
        `${location.origin}/_action/contact_click?page=%2F&channel=email`,
      ]);
      expect(win.dataLayer ?? []).toEqual([]);
    });

    it('drops an action whose parameters look like personal data', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const script = loadedScript();
      setup();
      TestBed.inject(AnalyticsService).track('contact_form_submit', {
        topic: 'me@example.com',
        has_service: false,
        message_length_bucket: '0-50',
      } as never);
      expect(script.sent).toEqual([]);
      warn.mockRestore();
    });
  });
});

describe('Vercel URLs', () => {
  it('redacts a URL to origin, path and utm_* parameters', () => {
    expect(redactUrl('https://factman.dev/a/b?utm_medium=email&x=1#y')).toBe(
      'https://factman.dev/a/b?utm_medium=email',
    );
  });

  it('builds an action URL from flat values only, without the page query or fragment', () => {
    expect(
      actionUrl('https://factman.dev/services/web?ref=a#x', 'service_enquiry', {
        service_id: 'web',
        channel: 'email',
        extra: { nested: true },
        none: null,
      }),
    ).toBe(
      'https://factman.dev/_action/service_enquiry?page=%2Fservices%2Fweb&service_id=web&channel=email',
    );
  });
});
