import { readFileSync } from 'node:fs';

/** The consent settings from site.json (the cookie name and the policy version it carries). */
const consent = (
  JSON.parse(readFileSync('src/data/site.json', 'utf8')) as {
    consent: { version: number; cookie: string; maxAgeDays: number };
  }
).consent;

/**
 * A stored "Reject all" decision for the current policy, as ConsentService writes it. Specs start
 * with it so the consent banner does not cover what they test; e2e/consent.spec.ts starts without
 * it to test the banner itself.
 */
export function decidedConsentState(baseURL: string) {
  const now = Date.now();
  const value = JSON.stringify({
    version: consent.version,
    decidedAt: now,
    expiresAt: now + consent.maxAgeDays * 24 * 60 * 60 * 1000,
    choices: { necessary: true, analytics: false, advertising: false },
  });
  const url = new URL(baseURL);
  return {
    cookies: [
      {
        name: consent.cookie,
        value: encodeURIComponent(value),
        domain: url.hostname,
        path: '/',
        expires: Math.round(now / 1000) + consent.maxAgeDays * 24 * 60 * 60,
        httpOnly: false,
        secure: url.protocol === 'https:',
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  };
}

export const CONSENT_COOKIE = consent.cookie;
