import { importProvidersFrom, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANALYTICS_TRACKER } from '@shared';

import { CoreModule } from '../core.module';
import { ConsentService } from '../consent/consent.service';
import { AnalyticsService } from './analytics.service';

type LayerWindow = Window & { dataLayer?: Record<string, unknown>[] };
const layer = () => (window as LayerWindow).dataLayer ?? [];

const setup = (environment: 'production' | 'preview' = 'production', platform = 'browser') => {
  TestBed.configureTestingModule({
    providers: [
      importProvidersFrom(CoreModule.forRoot({ environment })),
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return {
    analytics: TestBed.inject(AnalyticsService),
    consent: TestBed.inject(ConsentService),
  };
};

describe('AnalyticsService', () => {
  beforeEach(() => {
    document.cookie = 'fm_consent=; Max-Age=0; Path=/';
    localStorage.clear();
    delete (window as LayerWindow).dataLayer;
  });

  it('is the tracker components send to', () => {
    const { analytics } = setup();
    expect(TestBed.inject(ANALYTICS_TRACKER)).toBe(analytics);
  });

  it('sends nothing before a decision', () => {
    const { analytics } = setup();
    analytics.track('resume_download', { resume_id: 'fullstack', source: 'card' });
    expect(analytics.active).toBe(false);
    expect(layer()).toEqual([]);
  });

  it('sends nothing after Accept necessary', () => {
    const { analytics, consent } = setup();
    consent.declineAll();
    analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
    expect(layer()).toEqual([]);
  });

  it('pushes { event, ...params } once analytics is allowed, and stops when it is withdrawn', () => {
    const { analytics, consent } = setup();
    consent.acceptAll();
    analytics.track('resume_download', { resume_id: 'fullstack', source: 'card' });
    expect(layer()).toEqual([{ event: 'resume_download', resume_id: 'fullstack', source: 'card' }]);

    consent.declineAll();
    analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
    expect(layer()).toHaveLength(1);
  });

  it('drops events whose parameters look like personal data', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { analytics, consent } = setup();
    consent.acceptAll();
    analytics.track('filter_used', { scope: 'blog', value: 'me@example.com' });
    expect(layer()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"value"'));
    warn.mockRestore();
  });

  it('sends nothing on preview builds, even with consent', () => {
    const { analytics, consent } = setup('preview');
    consent.acceptAll();
    analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
    expect(layer()).toEqual([]);
  });

  it('sends nothing on the server', () => {
    const { analytics, consent } = setup('production', 'server');
    consent.acceptAll();
    analytics.track('cta_click', { cta_id: 'book', location: 'hero' });
    expect(layer()).toEqual([]);
  });
});
