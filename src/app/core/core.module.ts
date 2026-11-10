import { type ModuleWithProviders, NgModule, inject } from '@angular/core';
import { resolveSite, type SiteEnvironment } from '@shared';
import { site } from '@data/site';

import { AnalyticsModule } from './analytics/analytics.module';
import { SITE } from './config/site';
import { ConsentModule } from './consent/consent.module';
import { DataModule } from './data/data.module';
import { SeoModule } from './seo/seo.module';
import { ThemeModule } from './theme/theme.module';

export interface CoreOptions {
  /** Chosen at build time (`FM_SITE_ENV`): production, or preview (noindex, no analytics). */
  environment: SiteEnvironment;
}

/**
 * App-wide services, one NgModule per concern (ADR-002). Import it once, in `app.config.ts`:
 * `importProvidersFrom(CoreModule.forRoot({ environment }))`. Components stay standalone.
 */
@NgModule({
  imports: [DataModule, ThemeModule, SeoModule, AnalyticsModule, ConsentModule],
})
export class CoreModule {
  constructor() {
    if (inject(CoreModule, { optional: true, skipSelf: true })) {
      throw new Error('CoreModule is already loaded. Import it once, in app.config.ts.');
    }
  }

  static forRoot(options: CoreOptions): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [{ provide: SITE, useValue: resolveSite(site, options.environment) }],
    };
  }
}
