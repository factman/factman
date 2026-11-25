import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { CLOCK, ctaEvent, type Link, type ResponsivePortrait, Track, yearsSince } from '@shared';
import {
  Button,
  Icon,
  Image,
  Typewriter,
  iconArrowRight,
  iconBriefcase,
  iconClock,
  iconDownload,
  iconLayout,
  iconPin,
  iconTerminal,
} from '@ui/atoms';
import { type Availability, AvailabilityBadge, SocialLinks, StatCounter } from '@ui/molecules';

/** What the hero shows about the owner: the profile.json fields it uses. */
export interface ProfileHeroProfile {
  name: string;
  /** One or two sentences under the roles. */
  summary: string;
  /** The words the typewriter cycles through; the first is in the HTML from the start. */
  roles: readonly string[];
  location: { city: string; country: string };
  /** `YYYY-MM`: the "13+ years" are counted from it with the app clock (fixed at build time). */
  careerStart: string;
  /** profile.json's availability: `limited` and `unavailable` show as busy. */
  availability: { status: 'available' | 'limited' | 'unavailable'; message: string };
}

/** The counters under the socials (FR-11): computed from the data by the page. */
export interface ProfileHeroStats {
  organizations: number;
  technologies: number;
}

/**
 * The home page hero (FR-07, FR-08): availability, "Hello, I'm", the name as the page's h1, the
 * roles typed out one after another (the first role only, under reduced motion), the summary, where
 * and since when, the calls to action (book a service, view projects, résumé), socials and the
 * years, organizations and technologies counters. Beside it, the portrait with the code editor in
 * `[heroEditor]` (ETE-90). The section is the page's `#top`.
 *
 * Nothing moves the layout once painted: the roles line keeps one line's height, and the portrait
 * has its size and loads first. It doesn't open the résumé itself: it emits `openResume`.
 * @level organism
 */
@Component({
  selector: 'fm-profile-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // profile-hero* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './profile-hero.scss',
  imports: [AvailabilityBadge, Button, Icon, Image, SocialLinks, StatCounter, Track, Typewriter],
  host: { style: 'display: contents' },
  templateUrl: './profile-hero.html',
})
export class ProfileHero {
  /** The hero's calls to action (`cta_click`, location `hero`). */
  protected readonly cta = {
    book: ctaEvent('Book a service', 'hero'),
    projects: ctaEvent('View projects', 'hero'),
    terminal: ctaEvent('Terminal', 'hero'),
  };

  readonly profile = input.required<ProfileHeroProfile>();
  readonly photo = input<ResponsivePortrait>();
  readonly socials = input.required<readonly Pick<Link, 'id' | 'label' | 'url'>[]>();
  readonly stats = input.required<ProfileHeroStats>();
  /** The owner's time zone, e.g. "WAT · UTC+1". */
  readonly timezone = input<string>();
  /** Where "Book a service" goes. */
  readonly servicesHref = input('/services');
  /** Where "View projects" goes: the projects section of the home page. */
  readonly projectsHref = input('/#projects');

  /** Show the "Terminal" button (site.json `features.terminal`, FR-36, P1). */
  readonly terminal = input(false);

  /** The résumé to open: the fullstack one, as in the design. */
  readonly openResume = output<string>();
  /** "Terminal": open the interactive terminal. */
  readonly openTerminal = output<void>();

  protected readonly icons = {
    arrowRight: iconArrowRight,
    briefcase: iconBriefcase,
    clock: iconClock,
    download: iconDownload,
    layout: iconLayout,
    pin: iconPin,
    terminal: iconTerminal,
  };

  private readonly clock = inject(CLOCK);

  protected readonly years = computed(() => yearsSince(this.profile().careerStart, this.clock()));
  protected readonly badge = computed<Availability>(() =>
    this.profile().availability.status === 'available' ? 'available' : 'busy',
  );
  protected readonly place = computed(
    () => `${this.profile().location.city}, ${this.profile().location.country}`,
  );
}
