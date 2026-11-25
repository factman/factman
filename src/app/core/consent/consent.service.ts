import { computed, DOCUMENT, inject, Injectable, signal } from '@angular/core';

import { CONSENT } from './consent.token';
import {
  type ConsentCategoryId,
  type ConsentChoices,
  consentModeState,
  type ConsentModeState,
  type ConsentRecord,
  type ConsentStatus,
  createRecord,
  defaultChoices,
  optionalCategories,
  parseRecord,
  statusOf,
} from './consent-state';
import { createConsentStore } from './consent-storage';

/**
 * The visitor's cookie consent. Reads the decision kept in `fm_consent`, and asks
 * again when there is none, when the policy version in site.json has moved on, or when it has
 * lapsed. Consent Mode v2 in basic mode: nothing from Google loads until `analytics` is granted,
 * so `consentMode()` starts all denied and the analytics work reads it before loading any tag.
 */
@Injectable()
export class ConsentService {
  private readonly config = inject(CONSENT);
  private readonly store = createConsentStore(inject(DOCUMENT), this.config.cookie);
  private readonly now: () => number = () => Date.now();

  private readonly record = signal<ConsentRecord | null>(
    parseRecord(this.store.read(), this.config, this.now()),
  );

  /** `unset` until the visitor decides; then accepted, declined or custom. */
  readonly status = computed<ConsentStatus>(() => statusOf(this.config, this.record()));
  /** True while the banner should ask (first visit, version bump, expired decision). */
  readonly needsDecision = computed(() => this.record() === null);
  /** The categories in force: the stored decision, or each category's default until then. */
  readonly choices = computed<ConsentChoices>(
    () => this.record()?.choices ?? defaultChoices(this.config),
  );
  /** Consent Mode v2 state for the choices in force; all denied before a decision. */
  readonly consentMode = computed<ConsentModeState>(() => consentModeState(this.choices()));
  /** Categories the visitor can switch, in site.json order. */
  readonly optional = optionalCategories(this.config);

  /** Whether a category is allowed now. */
  granted(id: ConsentCategoryId): boolean {
    return this.choices()[id];
  }

  /** Allows every optional category. */
  acceptAll(): void {
    this.save(Object.fromEntries(this.optional.map((id) => [id, true])));
  }

  /** Refuses every optional category. */
  declineAll(): void {
    this.save({});
  }

  /** Stores a per-category choice; required categories stay on, unused ones off. */
  save(choices: Partial<Record<ConsentCategoryId, boolean>>): void {
    const record = createRecord(this.config, choices, this.now());
    this.store.write(JSON.stringify(record), this.config.maxAgeDays);
    this.record.set(record);
  }

  /** Forgets the decision so the banner asks again (the privacy page's "change" link). */
  reset(): void {
    this.store.clear();
    this.record.set(null);
  }
}
