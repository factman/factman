import { inject, NgModule } from '@angular/core';
import { ANALYTICS_TRACKER } from '@shared';

import { AnalyticsService } from './analytics.service';
import { VercelInsights } from './vercel-insights';

/**
 * Analytics: AnalyticsService (GTM and GA4 after consent), which components reach through
 * `ANALYTICS_TRACKER` (@shared), and VercelInsights (Vercel Web Analytics, cookieless, ETE-271).
 * Created with the app, so both start on the first page: Vercel's for everyone, GTM when the
 * visitor allowed analytics before (ETE-120).
 */
@NgModule({
  providers: [
    VercelInsights,
    AnalyticsService,
    { provide: ANALYTICS_TRACKER, useExisting: AnalyticsService },
  ],
})
export class AnalyticsModule {
  constructor() {
    inject(AnalyticsService);
  }
}
