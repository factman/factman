import type { SiteConsent } from '@shared';

import {
  consentModeState,
  createRecord,
  defaultChoices,
  normaliseChoices,
  optionalCategories,
  parseRecord,
  statusOf,
} from './consent-state';

const config: SiteConsent = {
  version: 2,
  cookie: 'fm_consent',
  maxAgeDays: 182,
  categories: [
    {
      id: 'necessary',
      label: '',
      description: '',
      required: true,
      defaultGranted: true,
      storage: [],
    },
    {
      id: 'analytics',
      label: '',
      description: '',
      required: false,
      defaultGranted: false,
      storage: [],
    },
    {
      id: 'advertising',
      label: '',
      description: '',
      required: false,
      defaultGranted: false,
      used: false,
      storage: [],
    },
  ],
};
const NOW = Date.UTC(2026, 10, 25);
const DAY = 24 * 60 * 60 * 1000;

describe('consent state', () => {
  it('lists only switchable categories that the site uses', () => {
    expect(optionalCategories(config)).toEqual(['analytics']);
  });

  it('keeps required categories on and unused ones off, whatever is asked', () => {
    expect(
      normaliseChoices(config, { necessary: false, advertising: true, analytics: true }),
    ).toEqual({ necessary: true, analytics: true, advertising: false });
  });

  it('defaults to everything optional denied', () => {
    const choices = defaultChoices(config);
    expect(choices).toEqual({ necessary: true, analytics: false, advertising: false });
    expect(consentModeState(choices)).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('grants analytics storage only, never ads, on accept', () => {
    const record = createRecord(config, { analytics: true }, NOW);
    expect(consentModeState(record.choices)).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('stamps the version and a 6-month lifetime', () => {
    const record = createRecord(config, {}, NOW);
    expect(record.version).toBe(2);
    expect(record.expiresAt - record.decidedAt).toBe(182 * DAY);
  });

  it('round-trips a stored decision', () => {
    const record = createRecord(config, { analytics: true }, NOW);
    expect(parseRecord(JSON.stringify(record), config, NOW + DAY)).toEqual(record);
  });

  it('drops a decision from another policy version (re-prompt)', () => {
    const old = createRecord({ ...config, version: 1 }, { analytics: true }, NOW);
    expect(parseRecord(JSON.stringify(old), config, NOW)).toBeNull();
  });

  it('drops an expired decision', () => {
    const record = createRecord(config, { analytics: true }, NOW);
    expect(parseRecord(JSON.stringify(record), config, record.expiresAt)).toBeNull();
  });

  it.each([
    null,
    '',
    'not json',
    '42',
    'null',
    '{"version":2}',
    '{"version":2,"decidedAt":1,"expiresAt":"x"}',
  ])('treats %j as no decision', (raw) => expect(parseRecord(raw, config, NOW)).toBeNull());

  it('normalises tampered choices', () => {
    const raw = JSON.stringify({
      version: 2,
      decidedAt: NOW,
      expiresAt: NOW + DAY,
      choices: { necessary: false, analytics: 'yes', advertising: true },
    });
    expect(parseRecord(raw, config, NOW)?.choices).toEqual({
      necessary: true,
      analytics: false,
      advertising: false,
    });
  });

  it('reports unset, accepted and declined', () => {
    expect(statusOf(config, null)).toBe('unset');
    expect(statusOf(config, createRecord(config, { analytics: true }, NOW))).toBe('accepted');
    expect(statusOf(config, createRecord(config, {}, NOW))).toBe('declined');
  });

  it('reports custom when some optional categories are on', () => {
    const two: SiteConsent = {
      ...config,
      categories: [
        config.categories[0],
        config.categories[1],
        { ...config.categories[2], used: true },
      ],
    };
    expect(statusOf(two, createRecord(two, { analytics: true }, NOW))).toBe('custom');
  });
});
