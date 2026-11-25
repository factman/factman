import { DOCUMENT, inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  type AnalyticsEventName,
  type AnalyticsEvents,
  type AnalyticsTracker,
  checkParams,
} from '@shared';

import { ConsentService } from '../consent/consent.service';
import { ANALYTICS } from './analytics.token';

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

/**
 * Sends the catalogue's events (FR-35, PRD §10) to the GTM data layer:
 * `dataLayer.push({ event, ...params })`. It is a no-op on the server, when analytics is off for
 * this build (previews), and until the visitor allows analytics; an event refused then is dropped,
 * not queued. Parameters that look like personal data are refused too (a dev-mode warning names
 * the key). Loading GTM itself arrives with ETE-120.
 */
@Injectable()
export class AnalyticsService implements AnalyticsTracker {
  private readonly config = inject(ANALYTICS);
  private readonly consent = inject(ConsentService);
  private readonly window = inject(DOCUMENT).defaultView as DataLayerWindow | null;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Whether events are sent now: a browser, analytics on for this build, and allowed. */
  get active(): boolean {
    return (
      this.browser && !!this.window && this.config.enabled && this.consent.granted('analytics')
    );
  }

  track<K extends AnalyticsEventName>(name: K, params: AnalyticsEvents[K]): void {
    if (!this.active) return;
    const bad = checkParams(params as Record<string, unknown>);
    if (bad) {
      if (isDevMode())
        console.warn(`analytics: ${name} dropped, "${bad}" looks like personal data`);
      return;
    }
    const layer = (this.window!.dataLayer ??= []);
    layer.push({ event: name, ...params });
  }
}
