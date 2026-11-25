# ADR-005: A static CSP, with analytics consent enforced in code

- **Status:** Accepted
- **Date:** 2026-11-25
- **Issue:** ETE-129 (with ETE-120, ETE-123, ETE-271)

## Context

The site is prerendered and served by Vercel from `vercel.json`, so every response header is
fixed at deploy time: no server code runs per request and none can read the visitor's consent
cookie. The Content-Security-Policy has to allow Google Tag Manager and GA4 for visitors who
accept analytics, while the privacy rule (FR-34, FR-35) is that nothing from Google loads before
a visitor chooses.

The policy is strict elsewhere: `script-src 'self'` plus SHA-256 hashes of the inline scripts
(theme pre-paint, Angular event replay; `pnpm csp:hashes`), no `'unsafe-inline'` or
`'unsafe-eval'` for scripts, `require-trusted-types-for 'script'` with named policies,
`object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'none'`.

## Options considered

1. **A CSP that changes with consent** (an edge function or middleware reading `fm_consent` and
   adding Google's hosts). It is the only way the header itself could express consent, but it
   needs per-request compute on a static site, the first page after Accept all would still run
   under the old header, and a cached page could carry the wrong policy.
2. **Two static policies chosen by a cookie in `vercel.json` (`has: cookie`)**. Vercel can match
   a header rule on a cookie, but only on its presence or exact value, and `fm_consent` is a
   versioned JSON record. It would also put consent logic in two places.
3. **One static CSP that allows exactly Google's tag and beacon hosts, with consent enforced in
   code and proved by tests.** Allowing a host does not load it: only `AnalyticsService` adds
   `gtm.js`, and only after `analytics` is granted.

## Decision

Option 3. The CSP allows `https://www.googletagmanager.com` in `script-src`, GA4's beacon hosts in
`connect-src` and `img-src`, and the `fm-gtm` and `goog#html` Trusted Types policies, for every
visitor. Whether Google loads is decided in the browser:

- `AnalyticsService` loads GTM only when consent allows `analytics` (Consent Mode v2, basic), on
  production builds, never on the server, previews or in dev mode. Withdrawal sends a denied
  consent update, sets `ga-disable-<id>` and deletes GA's cookies.
- `fm-gtm` accepts only `https://www.googletagmanager.com/gtm.js?id=GTM-…`, so even with the host
  allowed no other script URL can be created through it.
- The gate is tested: `e2e/analytics.production.spec.ts` (production build, CI) records every
  request on a first visit and after Accept necessary and expects none to Google; the IT suite
  (IT-07) checks Accept and Reject; `tools/vercel/headers.test.mjs` pins the policy.

Vercel Web Analytics is same-origin (`/_vercel/insights/*`) and cookieless, so it needs no CSP
change beyond its `fm-vercel-insights` Trusted Types policy and runs without consent (ETE-271).

The policy is derived, not hand-edited, for previews: production hosts (`factman.dev`) get the
policy above, every other host gets the same policy plus the Vercel Toolbar's sources
(`pnpm csp:hashes`, `withToolbar`).

## Consequences

- No per-request compute; the policy is cacheable and identical for every visitor on a host.
- An XSS on the site could load GTM before consent, since the host is allowed. Trusted Types, the
  hash-only `script-src` and the `fm-gtm` URL check make that injection much harder, and the
  e2e gate catches any code path that loads Google early.
- Adding a tag in GTM that loads another host means adding that host here (and to the tests):
  the CSP blocks it until then, which is the intended review point.
- `tools/vercel/live-headers.mjs` checks a deployment's real headers against `vercel.json`
  (CI on previews when `VERCEL_AUTOMATION_BYPASS_SECRET` is set; any time on production).
