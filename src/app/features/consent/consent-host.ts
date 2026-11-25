import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CONSENT, ConsentService, OPEN_CONSENT_EVENT } from '@core/consent';
import { ANALYTICS_TRACKER } from '@shared';
import {
  type ConsentCategoryView,
  type ConsentDecision,
  CookieConsentTerminal,
} from '@ui/organisms';

/**
 * The cookie consent banner on every page (FR-34), wired to `ConsentService`. It opens by itself
 * while the visitor has not decided (first visit, policy version bump, lapsed decision), and when
 * asked from the privacy page or the footer (`fm-consent-open`), taking focus then. Esc or the
 * close button closes it for this page view without deciding, so nothing is granted.
 *
 * The banner's code loads only when it opens, so a visitor who has decided never downloads it,
 * and the prerendered pages hold no banner.
 * @level page
 */
@Component({
  selector: 'fm-consent-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CookieConsentTerminal],
  template: `
    @defer (when open()) {
      <fm-cookie-consent-terminal
        [open]="open()"
        [categories]="categories()"
        [focusOnOpen]="requested()"
        [opener]="opener()"
        (decide)="decide($event)"
        (dismissed)="close()"
      />
    }
  `,
})
export class ConsentHost {
  private readonly consent = inject(ConsentService);
  private readonly config = inject(CONSENT);
  private readonly tracker = inject(ANALYTICS_TRACKER);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Closed for this page view (decided or dismissed); reopened on request. */
  private readonly closed = signal(false);
  /** The visitor asked for the banner, so it takes focus. */
  protected readonly requested = signal(false);
  /** The control that asked for it, to give focus back to. */
  protected readonly opener = signal<HTMLElement | null>(null);
  /** The control last pressed: Safari does not focus buttons on click. */
  private pressed: HTMLElement | null = null;
  protected readonly open = computed(
    () => this.browser && !this.closed() && (this.requested() || this.consent.needsDecision()),
  );
  protected readonly categories = computed<ConsentCategoryView[]>(() => {
    const choices = this.consent.choices();
    return this.config.categories.map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description,
      required: c.required,
      used: c.used !== false,
      granted: choices[c.id],
    }));
  });

  constructor() {
    if (!this.browser) return;
    const doc = inject(DOCUMENT);
    const press = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      this.pressed = target?.closest<HTMLElement>('button, a[href], [tabindex]') ?? null;
    };
    const reopen = () => {
      // Safari focuses no button on click (at most a focusable ancestor such as <main>), so the
      // control last pressed wins when focus is on the page or on something that contains it.
      const active = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
      const pressed = this.pressed?.isConnected ? this.pressed : null;
      this.opener.set(
        pressed &&
          (!active || active === doc.body || (active !== pressed && active.contains(pressed)))
          ? pressed
          : active !== doc.body
            ? active
            : null,
      );
      this.requested.set(true);
      this.closed.set(false);
    };
    doc.addEventListener('pointerdown', press, true);
    doc.addEventListener(OPEN_CONSENT_EVENT, reopen);
    inject(DestroyRef).onDestroy(() => {
      doc.removeEventListener('pointerdown', press, true);
      doc.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    });
  }

  protected decide(decision: ConsentDecision): void {
    this.consent.save(decision);
    // Sent only when the decision allows analytics: the tracker is a no-op otherwise.
    this.tracker.track('consent_update', {
      analytics: this.consent.granted('analytics'),
      source: this.requested() ? 'settings' : 'prompt',
    });
    this.close();
  }

  protected close(): void {
    this.closed.set(true);
    this.requested.set(false);
  }
}
