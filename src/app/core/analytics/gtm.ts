/**
 * Google Tag Manager plumbing for AnalyticsService (ETE-120): the gtag-style command queue, the
 * script loader behind its own Trusted Types policy, and clearing GA's cookies on withdrawal.
 */

/** The Trusted Types policy that may set GTM's script URL (listed in the CSP's `trusted-types`). */
export const GTM_POLICY = 'fm-gtm';

/** A GTM container ID, as site.json holds it. */
export const GTM_ID = /^GTM-[A-Z0-9]+$/;

/** The only script URL the `fm-gtm` policy accepts. */
const GTM_URL = /^https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+$/;

export type DataLayerWindow = Window & {
  dataLayer?: unknown[];
  trustedTypes?: TrustedTypesFactory;
} & Record<`ga-disable-${string}`, boolean | undefined>;

interface ScriptUrlPolicy {
  createScriptURL(input: string): unknown;
}
interface TrustedTypesFactory {
  createPolicy(name: string, rules: { createScriptURL(input: string): string }): ScriptUrlPolicy;
}

/** One policy per window: a CSP without `'allow-duplicates'` refuses a second by the same name. */
const policies = new WeakMap<TrustedTypesFactory, ScriptUrlPolicy | null>();

function gtmPolicy(win: DataLayerWindow): ScriptUrlPolicy | null {
  const factory = win.trustedTypes;
  if (!factory) return null;
  if (!policies.has(factory)) {
    let policy: ScriptUrlPolicy | null = null;
    try {
      policy = factory.createPolicy(GTM_POLICY, {
        createScriptURL: (input) => {
          if (!GTM_URL.test(input)) throw new TypeError(`${GTM_POLICY}: refused ${input}`);
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

/** The data layer, created on first use. */
export function dataLayer(win: DataLayerWindow): unknown[] {
  return (win.dataLayer ??= []);
}

/** A command as GTM reads it: an `arguments` object, not an array. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function asArguments(...command: unknown[]): IArguments {
  // eslint-disable-next-line prefer-rest-params
  return arguments;
}

/** Queues a gtag command (`consent`, `set`, …), as Google's `gtag()` does. */
export function gtag(win: DataLayerWindow, ...command: unknown[]): void {
  dataLayer(win).push(asArguments(...command));
}

/**
 * Adds GTM's script (`gtm.js?id=…`, async) to the <head>, after the `gtm.js` start event, as
 * Google's snippet does. The URL goes through the `fm-gtm` policy.
 */
export function loadGtm(win: DataLayerWindow, doc: Document, id: string): void {
  if (!GTM_ID.test(id)) throw new Error(`analytics: "${id}" is not a GTM container ID`);
  dataLayer(win).push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const url = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  const script = doc.createElement('script');
  script.async = true;
  script.id = 'fm-gtm';
  (script as { src: unknown }).src = gtmPolicy(win)?.createScriptURL(url) ?? url;
  doc.head.append(script);
}

/** GA4's cookies: `_ga`, `_ga_<id>`, and the older `_gid` and `_gat*`. */
const GA_COOKIE = /^_(ga|gid|gat)(_|$)/;

/**
 * Deletes GA's cookies. GA sets them on the widest domain it may (`.factman.dev`), so each is
 * expired on the host and on every parent domain.
 */
export function clearAnalyticsCookies(doc: Document): void {
  const names = doc.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((n) => GA_COOKIE.test(n));
  if (!names.length) return;
  const labels = (doc.location?.hostname ?? '').split('.');
  const domains = [
    '',
    ...labels.slice(0, -1).map((_, i) => `; Domain=.${labels.slice(i).join('.')}`),
  ];
  for (const name of names) {
    for (const domain of domains) {
      doc.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
  }
}

/**
 * The page as analytics sees it: origin and path only. Fragments (`#resume=fullstack`) and query
 * strings are left out, so nothing a visitor typed or was sent reaches Google.
 */
export function pageLocation(href: string): { page_location: string; page_path: string } {
  const url = new URL(href);
  return { page_location: url.origin + url.pathname, page_path: url.pathname };
}
