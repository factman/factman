import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { site } from '@data/site';

import { CoreModule } from '../core.module';
import { createRecord } from './consent-state';
import { ConsentService } from './consent.service';

const KEY = 'fm_consent';
const config = site.consent;

const clearCookie = () => {
  document.cookie = `${KEY}=; Max-Age=0; Path=/`;
};
/** Replaces `document.cookie` on this document (an own property shadows the prototype's). */
const blockCookies = (read: () => string) => {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: read,
    set: () => read(),
  });
};
const unblockCookies = () => {
  delete (document as { cookie?: string }).cookie;
};
const storedCookie = (): string | null => {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${KEY}=`));
  return hit ? decodeURIComponent(hit.slice(KEY.length + 1)) : null;
};

describe('ConsentService', () => {
  const setup = () => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(CoreModule.forRoot({ environment: 'production' }))],
    });
    return TestBed.inject(ConsentService);
  };

  beforeEach(() => {
    clearCookie();
    localStorage.clear();
  });

  afterEach(() => {
    unblockCookies();
    vi.restoreAllMocks();
  });

  it('asks on a first visit, with everything optional denied', () => {
    const consent = setup();
    expect(consent.status()).toBe('unset');
    expect(consent.needsDecision()).toBe(true);
    expect(consent.granted('necessary')).toBe(true);
    expect(consent.granted('analytics')).toBe(false);
    expect(consent.consentMode().analytics_storage).toBe('denied');
    expect(consent.consentMode().ad_storage).toBe('denied');
  });

  it('accepts, stores the decision in the fm_consent cookie with the policy version', () => {
    const consent = setup();
    consent.acceptAll();
    expect(consent.status()).toBe('accepted');
    expect(consent.needsDecision()).toBe(false);
    expect(consent.consentMode().analytics_storage).toBe('granted');
    expect(consent.consentMode().ad_storage).toBe('denied'); // advertising is not used

    const stored = JSON.parse(storedCookie() ?? 'null');
    expect(stored.version).toBe(config.version);
    expect(stored.choices.analytics).toBe(true);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('declines', () => {
    const consent = setup();
    consent.declineAll();
    expect(consent.status()).toBe('declined');
    expect(consent.needsDecision()).toBe(false);
    expect(consent.granted('analytics')).toBe(false);
    expect(JSON.parse(storedCookie() ?? 'null').choices.analytics).toBe(false);
  });

  it('restores a stored decision on the next visit', () => {
    setup().acceptAll();
    TestBed.resetTestingModule();
    expect(setup().status()).toBe('accepted');
  });

  it('asks again after a policy version bump', () => {
    const old = createRecord(
      { ...config, version: config.version - 1 },
      { analytics: true },
      Date.now(),
    );
    document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(old))}; Path=/`;
    const consent = setup();
    expect(consent.status()).toBe('unset');
    expect(consent.granted('analytics')).toBe(false);
  });

  it('falls back to localStorage when cookies are blocked', () => {
    blockCookies(() => '');
    setup().acceptAll();
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null').choices.analytics).toBe(true);

    TestBed.resetTestingModule();
    expect(setup().status()).toBe('accepted');
  });

  it('keeps the choice for the page view when all storage is blocked', () => {
    blockCookies(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    const consent = setup();
    expect(consent.status()).toBe('unset');
    expect(() => consent.acceptAll()).not.toThrow();
    expect(consent.status()).toBe('accepted');
  });

  it('reset forgets the decision and asks again', () => {
    const consent = setup();
    consent.acceptAll();
    consent.reset();
    expect(consent.status()).toBe('unset');
    expect(storedCookie()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
