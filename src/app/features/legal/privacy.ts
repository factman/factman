import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject } from '@angular/core';
import { CONSENT, ConsentService, OPEN_CONSENT_EVENT } from '@core/consent';
import { contact } from '@data/contact';
import { PageHero, PrivacyPolicySection, type StorageItem } from '@ui/organisms';

export { OPEN_CONSENT_EVENT } from '@core/consent';

/** What each stored key does, by name; keys not listed use their category's description. */
const PURPOSE: Record<string, string> = {
  fm_consent: 'Stores your cookie choice',
  fm_theme: 'Remembers Light or Dark',
  fm_blog: 'Keeps the Medium articles for 12 hours, so the blog loads fast',
  _ga: 'Distinguishes visitors (Google Analytics 4)',
  '_ga_<id>': 'Keeps session state (Google Analytics 4)',
};

/**
 * The cookie and storage table, from site.json's consent categories: `"fm_consent (6 months)"` →
 * name `fm_consent`, lifetime `6 months`. A key with no lifetime lasts until cleared.
 */
export function storageItems(
  categories: readonly { label: string; description: string; storage?: readonly string[] }[],
): StorageItem[] {
  return categories.flatMap((c) =>
    (c.storage ?? []).map((entry) => {
      const match = /^(\S+)(?:\s+\(([^)]+)\))?$/.exec(entry.trim());
      const name = match?.[1] ?? entry;
      return {
        name,
        category: c.label[0].toUpperCase() + c.label.slice(1),
        purpose: PURPOSE[name] ?? c.description,
        lifetime: match?.[2] ?? 'Until cleared',
      };
    }),
  );
}

/**
 * Privacy policy (/privacy, ETE-116), as in the canvas: PageHero and the PrivacyPolicySection.
 * The policy's version is the consent version in site.json, so changing what is stored (and
 * bumping that version) asks visitors again. "Change cookie settings" asks the consent banner to
 * reopen (`fm-consent-open`).
 * @level page
 */
@Component({
  selector: 'fm-privacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHero, PrivacyPolicySection],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class PrivacyPage {
  private readonly document = inject(DOCUMENT);
  private readonly consent = inject(CONSENT);
  private readonly choice = inject(ConsentService);

  protected readonly crumbs = [{ label: 'Home', href: '/' }, { label: 'Privacy' }];
  protected readonly note = `Policy version ${this.consent.version}`;
  protected readonly storage = storageItems(this.consent.categories);
  protected readonly email = contact.email;
  /** The status card's analytics line: on, off, or not decided yet. */
  protected readonly analytics = computed(() =>
    this.choice.needsDecision() ? 'unset' : this.choice.granted('analytics') ? 'granted' : 'denied',
  );

  protected openSettings(): void {
    this.document.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  }
}
