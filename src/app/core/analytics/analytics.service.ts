import {
  afterNextRender,
  DestroyRef,
  EnvironmentInjector,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  isDevMode,
  PLATFORM_ID,
  untracked,
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import {
  type AnalyticsEventName,
  type AnalyticsEvents,
  type AnalyticsTracker,
  checkParams,
} from '@shared';

import { ConsentService } from '../consent/consent.service';
import { ANALYTICS } from './analytics.token';
import {
  clearAnalyticsCookies,
  dataLayer,
  type DataLayerWindow,
  gtag,
  loadGtm,
  pageLocation,
} from './gtm';

/**
 * Google Tag Manager and GA4, only after consent (FR-35, ETE-120), and the catalogue's events
 * (ETE-121) through GTM's data layer: `dataLayer.push({ event, ...params })`.
 *
 * Consent Mode v2 in basic mode: nothing from Google loads until the visitor allows `analytics`.
 * Then the consent state is queued (`gtag('consent', 'default', …)`) and GTM's script is added,
 * and each page is sent as a `page_view` event with its origin and path only (no fragment or
 * query). The GTM container must fire GA4's page view on that event, not on load or history
 * changes (ETE-122). Withdrawing consent queues `gtag('consent', 'update', …)` with analytics
 * denied, switches GA4 off (`ga-disable-<id>`), deletes GA's cookies and stops all events; GTM's
 * script stays loaded until the next page load. Allowing it again in the same page view turns it
 * back on.
 *
 * Nothing runs on the server, in dev mode, or on builds where analytics is off (previews). An
 * event refused is dropped, not queued; one whose parameters look like personal data is refused
 * too (a dev-mode warning names the key).
 */
@Injectable()
export class AnalyticsService implements AnalyticsTracker {
  private readonly config = inject(ANALYTICS);
  private readonly consent = inject(ConsentService);
  private readonly doc = inject(DOCUMENT);
  private readonly window = this.doc.defaultView as DataLayerWindow | null;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly location = inject(Location);
  /** The consent last applied to Google's tags: null until GTM loads. */
  private applied: boolean | null = null;
  /** The last page sent, so fragment-only navigation (`/#about`) isn't a second page view. */
  private lastPage: string | null = null;

  constructor() {
    if (!this.enabled) return;
    // The consent in force now, and every change to it.
    effect(() => {
      this.consent.choices();
      untracked(() => this.sync());
    });
    // After the new page renders, so its title is set.
    const injector = inject(EnvironmentInjector);
    const events = inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        afterNextRender({ read: () => this.pageView() }, { injector });
    });
    inject(DestroyRef).onDestroy(() => events.unsubscribe());
  }

  /** A browser, analytics on for this build. */
  private get enabled(): boolean {
    return this.browser && !!this.window && this.config.enabled;
  }

  /** Whether events are sent now: analytics on for this build, and allowed. */
  get active(): boolean {
    return this.enabled && this.consent.granted('analytics');
  }

  track<K extends AnalyticsEventName>(name: K, params: AnalyticsEvents[K]): void {
    if (!this.active) return;
    const bad = checkParams(params as Record<string, unknown>);
    if (bad) {
      if (isDevMode())
        console.warn(`analytics: ${name} dropped, "${bad}" looks like personal data`);
      return;
    }
    this.sync();
    dataLayer(this.window!).push({ event: name, ...params });
  }

  /** Brings Google's tags in line with the visitor's consent. */
  private sync(): void {
    const win = this.window!;
    const allowed = this.active;
    if (allowed === (this.applied ?? false)) {
      if (!allowed) clearAnalyticsCookies(this.doc);
      return;
    }
    const mode = this.consent.consentMode();
    const ga4 = this.config.ga4Id;
    if (ga4) win[`ga-disable-${ga4}`] = !allowed;
    if (allowed && this.applied === null) {
      if (!this.config.gtmId) return;
      gtag(win, 'consent', 'default', mode);
      loadGtm(win, this.doc, this.config.gtmId);
    } else {
      gtag(win, 'consent', 'update', mode);
    }
    this.applied = allowed;
    if (allowed) {
      this.lastPage = null;
      this.pageView();
    } else {
      clearAnalyticsCookies(this.doc);
    }
  }

  /** Sends the current page once per path, while GTM is loaded and allowed. */
  private pageView(): void {
    if (!this.active || !this.applied) return;
    const path = this.location.prepareExternalUrl(this.location.path(true) || '/');
    const page = pageLocation(new URL(path, this.doc.location.origin).href);
    if (page.page_location === this.lastPage) return;
    this.lastPage = page.page_location;
    dataLayer(this.window!).push({ event: 'page_view', ...page, page_title: this.doc.title });
  }
}
