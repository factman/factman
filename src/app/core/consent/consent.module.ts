import { InjectionToken, NgModule, inject } from '@angular/core';
import type { ResolvedSite } from '@shared';

import { SITE } from '../config/site';

/** Consent settings: cookie name, version, lifetime and categories (bump the version to re-ask). */
export const CONSENT = new InjectionToken<ResolvedSite['consent']>('fm.consent', {
  providedIn: 'root',
  factory: () => inject(SITE).consent,
});

/** Cookie consent. The banner and the stored choice arrive with the consent work. */
@NgModule({})
export class ConsentModule {}
