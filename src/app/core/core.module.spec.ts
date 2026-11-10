import { createEnvironmentInjector, EnvironmentInjector, importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ANALYTICS } from './analytics/analytics.module';
import { SITE } from './config/site';
import { CONSENT } from './consent/consent.module';
import { CoreModule } from './core.module';

describe('CoreModule', () => {
  const setup = (environment: 'production' | 'preview') =>
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(CoreModule.forRoot({ environment }))],
    });

  it('provides production site settings from site.json', () => {
    setup('production');
    const site = TestBed.inject(SITE);
    expect(site.name).toBe('Odunayo Mohammed');
    expect(site.robots).toBe('index');
    expect(TestBed.inject(ANALYTICS).enabled).toBe(true);
    expect(TestBed.inject(CONSENT).cookie).toBe('fm_consent');
  });

  it('applies the preview overrides: noindex, analytics off', () => {
    setup('preview');
    expect(TestBed.inject(SITE).robots).toBe('noindex');
    expect(TestBed.inject(ANALYTICS).enabled).toBe(false);
    expect(TestBed.inject(ANALYTICS).gtmId).toBe('GTM-MB3JFBJ6');
  });

  it('refuses to be imported twice', () => {
    setup('production');
    const root = TestBed.inject(EnvironmentInjector);
    expect(() =>
      createEnvironmentInjector(
        [importProvidersFrom(CoreModule.forRoot({ environment: 'production' }))],
        root,
      ),
    ).toThrowError(/already loaded/);
  });
});
