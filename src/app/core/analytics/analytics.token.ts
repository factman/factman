import { InjectionToken, inject, isDevMode } from '@angular/core';
import type { ResolvedSite } from '@shared';

import { SITE } from '../config/site';

/**
 * GTM and GA4 settings for this build. Analytics is off on previews (site.json) and in dev mode
 * (`ng serve`), so neither ever loads Google's tags.
 */
export const ANALYTICS = new InjectionToken<ResolvedSite['analytics']>('fm.analytics', {
  providedIn: 'root',
  factory: () => {
    const analytics = inject(SITE).analytics;
    return isDevMode() ? { ...analytics, enabled: false } : analytics;
  },
});
