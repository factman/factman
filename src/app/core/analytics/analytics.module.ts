import { inject, NgModule } from '@angular/core';
import { ANALYTICS_TRACKER } from '@shared';

import { AnalyticsService } from './analytics.service';

/**
 * Analytics (GTM and GA4): AnalyticsService, which components reach through `ANALYTICS_TRACKER`
 * (@shared). Created with the app, so GTM loads on a returning visitor's first page when they
 * allowed analytics before (ETE-120).
 */
@NgModule({
  providers: [AnalyticsService, { provide: ANALYTICS_TRACKER, useExisting: AnalyticsService }],
})
export class AnalyticsModule {
  constructor() {
    inject(AnalyticsService);
  }
}
