import { InjectionToken, inject } from '@angular/core';
import type { ResolvedSite } from '@shared';

import { SITE } from '../config/site';

/** GTM and GA4 settings for this build (analytics is off on previews). */
export const ANALYTICS = new InjectionToken<ResolvedSite['analytics']>('fm.analytics', {
  providedIn: 'root',
  factory: () => inject(SITE).analytics,
});
