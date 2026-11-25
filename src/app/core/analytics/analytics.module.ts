import { NgModule } from '@angular/core';
import { ANALYTICS_TRACKER } from '@shared';

import { AnalyticsService } from './analytics.service';

/**
 * Analytics (GTM and GA4): AnalyticsService, which components reach through `ANALYTICS_TRACKER`
 * (@shared). Events go to the data layer only after consent; loading GTM arrives with ETE-120.
 */
@NgModule({
  providers: [AnalyticsService, { provide: ANALYTICS_TRACKER, useExisting: AnalyticsService }],
})
export class AnalyticsModule {}
