import { InjectionToken, inject } from '@angular/core';
import type { ResolvedSite } from '@shared';

import { SITE } from '../config/site';

/** Consent settings: cookie name, version, lifetime and categories (bump the version to re-ask). */
export const CONSENT = new InjectionToken<ResolvedSite['consent']>('fm.consent', {
  providedIn: 'root',
  factory: () => inject(SITE).consent,
});

/**
 * Asks the consent banner to open (and take focus): the privacy page's "Change cookie settings"
 * and the footer's "cookie settings" dispatch it on `document`.
 */
export const OPEN_CONSENT_EVENT = 'fm-consent-open';
