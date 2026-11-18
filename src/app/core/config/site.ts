import { InjectionToken } from '@angular/core';
import type { ResolvedSite } from '@shared';

/**
 * Site settings for the environment this build targets (`site.json` with that environment's
 * overrides applied). Provided once by `CoreModule.forRoot()`; inject it, never import `site.json`.
 */
export const SITE = new InjectionToken<ResolvedSite>('fm.site');
