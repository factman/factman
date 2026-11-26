import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type BeforeSendEvent, inject as injectAnalytics, pageview } from '@vercel/analytics';
import { type AnalyticsEventName, type AnalyticsEvents, KEY_EVENTS, whenIdle } from '@shared';

import { ANALYTICS } from './analytics.token';

/** The Trusted Types policy that may set the insights script's URL (CSP `trusted-types`). */
export const VERCEL_INSIGHTS_POLICY = 'fm-vercel-insights';

/** Vercel's first-party insights script, served once Web Analytics is enabled on the project. */
export const VERCEL_INSIGHTS_SCRIPT = '/_vercel/insights/script.js';

/** The path a key action is sent under, as a virtual page view: `/_action/<event>`. */
export const ACTION_PATH = '/_action/';

/** Query parameters a page view keeps: campaign tags, which Vercel reports as UTM dimensions. */
const KEPT_PARAM = /^utm_(source|medium|campaign|content|term)$/;

interface ScriptUrlPolicy {
  createScriptURL(input: string): unknown;
}
interface TrustedTypesFactory {
  createPolicy(name: string, rules: { createScriptURL(input: string): string }): ScriptUrlPolicy;
}

const policies = new WeakMap<TrustedTypesFactory, ScriptUrlPolicy | null>();

function insightsPolicy(win: Window & { trustedTypes?: TrustedTypesFactory }) {
  const factory = win.trustedTypes;
  if (!factory) return null;
  if (!policies.has(factory)) {
    let policy: ScriptUrlPolicy | null = null;
    try {
      policy = factory.createPolicy(VERCEL_INSIGHTS_POLICY, {
        createScriptURL: (input) => {
          if (input !== VERCEL_INSIGHTS_SCRIPT)
            throw new TypeError(`${VERCEL_INSIGHTS_POLICY}: refused ${input}`);
          return input;
        },
      });
    } catch {
      // The CSP doesn't list the policy: assign the plain string, and the CSP reports it.
    }
    policies.set(factory, policy);
  }
  return policies.get(factory) ?? null;
}

/**
 * A page's URL as Vercel receives it: origin and path, plus campaign tags. Fragments
 * (`#resume=fullstack`) and any other query parameter are dropped.
 */
export function redactUrl(href: string): string {
  const url = new URL(href);
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (KEPT_PARAM.test(key)) kept.append(key, value);
  });
  const query = kept.toString();
  return url.origin + url.pathname + (query ? `?${query}` : '');
}

/**
 * A key action as a virtual page view's URL: `/_action/<event>?page=<path>&<params>`. Params are
 * the catalogue's checked, flat values (no personal data, ETE-121).
 */
export function actionUrl(
  href: string,
  name: AnalyticsEventName,
  params: Readonly<Record<string, unknown>>,
): string {
  const page = new URL(href);
  const url = new URL(ACTION_PATH + name, page.origin);
  url.searchParams.set('page', page.pathname);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && typeof value !== 'object')
      url.searchParams.set(key, String(value));
  }
  return url.href;
}

/**
 * Vercel Web Analytics (ETE-271), alongside GTM and GA4. It sets no cookies and stores nothing
 * on the device; a visitor is a hash of the request, kept for a day. So it runs for everyone,
 * without the consent banner, but only on production builds (never on previews, in dev mode or on
 * the server).
 *
 * The script is added here, through the `fm-vercel-insights` Trusted Types policy, before
 * `inject()` from `@vercel/analytics` runs (it then finds the script and adds no second one). The
 * script counts the first page and every path change (history pushState); fragment-only changes
 * are not new pages. `beforeSend` redacts every URL to origin, path and campaign tags.
 *
 * The Hobby plan has no custom events, so a key action (`KEY_EVENTS`: an enquiry, a form sent, a
 * résumé downloaded, …) is sent as a virtual page view on `/_action/<event>` with its parameters
 * and the page it happened on: `/_action/resume_download?page=/&resume_id=fullstack&source=card`.
 * Actions are filtered in the dashboard by that path, and stay out of the real pages' counts.
 */
@Injectable()
export class VercelInsights {
  private readonly config = inject(ANALYTICS);
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  /** The URL of the virtual page view being sent, while `pageview()` runs. */
  private pending: string | null = null;
  private started = false;

  constructor() {
    // After the page is up (ETE-126): the script and its setup are no part of the first paint, so
    // they run in their own task instead of the bootstrap one. The first page view still counts.
    if (this.enabled) whenIdle(this.doc.defaultView, () => this.start());
  }

  /** Production build, in a browser. */
  get enabled(): boolean {
    return this.browser && !!this.doc.defaultView && this.config.enabled;
  }

  private start(): void {
    if (!this.enabled || this.started) return;
    this.started = true;
    const win = this.doc.defaultView as Window & { trustedTypes?: TrustedTypesFactory };
    if (!this.doc.head.querySelector(`script[src*="${VERCEL_INSIGHTS_SCRIPT}"]`)) {
      const script = this.doc.createElement('script');
      script.defer = true;
      script.dataset['sdkn'] = '@vercel/analytics/angular';
      (script as { src: unknown }).src =
        insightsPolicy(win)?.createScriptURL(VERCEL_INSIGHTS_SCRIPT) ?? VERCEL_INSIGHTS_SCRIPT;
      this.doc.head.append(script);
    }
    injectAnalytics({
      mode: 'production',
      debug: false,
      framework: 'angular',
      beforeSend: (event) => this.beforeSend(event),
    });
  }

  /**
   * Sends a key action as a virtual page view (no-op for other events). Only once the script has
   * loaded: until then `pageview()` is queued, and `beforeSend` would see it after this returns,
   * as a second view of the current page.
   */
  action<K extends AnalyticsEventName>(name: K, params: AnalyticsEvents[K]): void {
    if (!this.enabled || !KEY_EVENTS.includes(name)) return;
    if (!(this.doc.defaultView as Window & { vai?: boolean }).vai) return;
    this.pending = actionUrl(this.doc.location.href, name, params as Record<string, unknown>);
    try {
      pageview({});
    } finally {
      this.pending = null;
    }
  }

  private beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
    if (event.type === 'pageview' && this.pending) return { ...event, url: this.pending };
    return { ...event, url: redactUrl(event.url) };
  }
}
