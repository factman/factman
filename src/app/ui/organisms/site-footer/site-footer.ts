import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CLOCK, type Link, prefersReducedMotion } from '@shared';
import { Button, Divider, Logo, iconArrowUp, iconTerminal } from '@ui/atoms';
import {
  type Availability,
  AvailabilityBadge,
  SocialLinks,
  TerminalSignOff,
  type Theme,
} from '@ui/molecules';

/** A link in the footer's Explore column: an app path such as `/services` or `/privacy`. */
export interface SiteFooterLink {
  label: string;
  href: string;
}

/** A résumé the footer offers: its id (fullstack, mobile, devops) and role title. */
export interface SiteFooterResume {
  id: string;
  title: string;
}

/**
 * The site footer: a glass panel with four columns (who and availability, Explore links, the
 * three résumés, contact and socials) above the terminal sign-off, the copyright line, "cookie
 * settings" and "Back to top". The page passes the data. It doesn't open the résumé or the consent
 * banner itself: it emits `openResume` with the résumé id and `cookies`.
 * The year defaults to the app clock's (fixed at build time, like every date on the site).
 * @level organism
 */
@Component({
  selector: 'fm-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // site-footer* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './site-footer.scss',
  imports: [AvailabilityBadge, Button, Divider, Logo, RouterLink, SocialLinks, TerminalSignOff],
  host: { style: 'display: contents' },
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  readonly theme = input.required<Theme>();
  /** One or two sentences under the logo. */
  readonly tagline = input.required<string>();
  /** Explore links: pages such as Services, Projects, Blog, Privacy. */
  readonly nav = input.required<readonly SiteFooterLink[]>();
  readonly resumes = input.required<readonly SiteFooterResume[]>();
  readonly email = input.required<string>();
  /** Where and when, e.g. "Lagos, Nigeria · WAT (UTC+1)". */
  readonly location = input<string>();
  readonly socials = input.required<readonly Pick<Link, 'id' | 'label' | 'url'>[]>();
  readonly availability = input<Availability>('available');
  /** The availability words, e.g. profile.availability.message. */
  readonly availabilityLabel = input<string>();
  /** The copyright holder. */
  readonly name = input('Odunayo Mohammed');
  /** The copyright year; defaults to the clock's year. */
  readonly year = input<number>();

  readonly openResume = output<string>();
  readonly cookies = output<void>();

  protected readonly icons = { arrowUp: iconArrowUp, terminal: iconTerminal };

  private readonly clock = inject(CLOCK);
  private readonly document = inject(DOCUMENT);

  protected readonly copyrightYear = computed(() => this.year() ?? this.clock().getFullYear());
  protected readonly mailto = computed(() => `mailto:${this.email()}`);

  /** Scrolls back to the top and puts focus at the start of the page, for keyboard users too. */
  protected backToTop(): void {
    const win = this.document.defaultView;
    win?.scrollTo({ top: 0, behavior: prefersReducedMotion(win) ? 'auto' : 'smooth' });
    const main = this.document.getElementById('main');
    main?.focus({ preventScroll: true });
  }
}
