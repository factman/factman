import type { SiteConsent, SiteConsentCategory } from '@shared';

/** A consent category from site.json. */
export type ConsentCategoryId = SiteConsentCategory['id'];

/** Which categories the visitor allows. Required categories are always true. */
export type ConsentChoices = Readonly<Record<ConsentCategoryId, boolean>>;

/** The visitor's stored decision. */
export interface ConsentRecord {
  /** Policy version the decision was made under (site.json `consent.version`). */
  readonly version: number;
  /** When it was made (ms since epoch). */
  readonly decidedAt: number;
  /** When it lapses (ms since epoch): `maxAgeDays` after the decision. */
  readonly expiresAt: number;
  readonly choices: ConsentChoices;
}

/**
 * Where the visitor stands: `unset` until they decide (or after a version bump or expiry),
 * `accepted` with every optional category on, `declined` with every one off, `custom` otherwise.
 */
export type ConsentStatus = 'unset' | 'accepted' | 'declined' | 'custom';

/** Google Consent Mode v2 parameters. */
export interface ConsentModeState {
  readonly analytics_storage: 'granted' | 'denied';
  readonly ad_storage: 'granted' | 'denied';
  readonly ad_user_data: 'granted' | 'denied';
  readonly ad_personalization: 'granted' | 'denied';
}

const DAY_MS = 24 * 60 * 60 * 1000;
const IDS: readonly ConsentCategoryId[] = ['necessary', 'analytics', 'advertising'];

/** Categories the visitor can switch: not required, and used on this site. */
export function optionalCategories(config: SiteConsent): ConsentCategoryId[] {
  return config.categories.filter((c) => !c.required && c.used !== false).map((c) => c.id);
}

/**
 * Normalises a choice: required categories are on, unused ones and ones the policy does not list
 * are off, whatever the input says.
 */
export function normaliseChoices(
  config: SiteConsent,
  input: Partial<Record<ConsentCategoryId, boolean>>,
): ConsentChoices {
  const out = { necessary: false, analytics: false, advertising: false };
  for (const c of config.categories) {
    out[c.id] = c.required ? true : c.used === false ? false : input[c.id] === true;
  }
  return out;
}

/** The choices before the visitor decides: each category's `defaultGranted`, normalised. */
export function defaultChoices(config: SiteConsent): ConsentChoices {
  return normaliseChoices(
    config,
    Object.fromEntries(config.categories.map((c) => [c.id, c.defaultGranted])),
  );
}

/** A new decision, stamped with the current policy version and lifetime. */
export function createRecord(
  config: SiteConsent,
  input: Partial<Record<ConsentCategoryId, boolean>>,
  now: number,
): ConsentRecord {
  return {
    version: config.version,
    decidedAt: now,
    expiresAt: now + config.maxAgeDays * DAY_MS,
    choices: normaliseChoices(config, input),
  };
}

/**
 * Parses a stored decision. Anything malformed, made under another policy version, or past its
 * expiry is `null`: the visitor is asked again.
 */
export function parseRecord(
  raw: string | null | undefined,
  config: SiteConsent,
  now: number,
): ConsentRecord | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const r = value as Partial<Record<keyof ConsentRecord, unknown>>;
  if (r.version !== config.version) return null;
  if (typeof r.decidedAt !== 'number' || typeof r.expiresAt !== 'number') return null;
  if (r.expiresAt <= now) return null;
  if (typeof r.choices !== 'object' || r.choices === null) return null;
  const choices = r.choices as Record<string, unknown>;
  const input = Object.fromEntries(IDS.map((id) => [id, choices[id] === true]));
  return {
    version: r.version,
    decidedAt: r.decidedAt,
    expiresAt: r.expiresAt,
    choices: normaliseChoices(config, input),
  };
}

/** The status a decision (or its absence) gives. */
export function statusOf(config: SiteConsent, record: ConsentRecord | null): ConsentStatus {
  if (!record) return 'unset';
  const optional = optionalCategories(config);
  const on = optional.filter((id) => record.choices[id]).length;
  if (on === optional.length) return 'accepted';
  return on === 0 ? 'declined' : 'custom';
}

/**
 * Consent Mode v2 state for the choices. Basic mode: the tags load only after a grant, and the
 * defaults they start from are all denied (see `defaultChoices`).
 */
export function consentModeState(choices: ConsentChoices): ConsentModeState {
  const analytics = choices.analytics ? 'granted' : 'denied';
  const ads = choices.advertising ? 'granted' : 'denied';
  return {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}
