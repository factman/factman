import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { contact } from '@data/contact';
import { experience } from '@data/experience';
import { profile } from '@data/profile';
import { skills } from '@data/skills';
import { portraitSources, SharedModule } from '@shared';
import { ProfileHero, type ProfileHeroStats } from '@ui/organisms';

import { HOME_SECTIONS } from './home-sections';

/** The networks the hero links to, in contact.json's order (ETeam has its own place). */
const HERO_SOCIALS = new Set(['github', 'linkedin', 'x', 'medium']);

/**
 * Home page (/): the profile hero (#top), then one section per anchor. The sections are shells
 * until their organisms are built.
 * @level page
 */
@Component({
  selector: 'fm-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileHero, RouterLink, SharedModule],
  templateUrl: './home.html',
})
export class Home {
  private readonly router = inject(Router);

  protected readonly sections = HOME_SECTIONS;
  protected readonly profile = profile;
  protected readonly photo = portraitSources(profile.photo);
  protected readonly socials = contact.links.filter((link) => HERO_SOCIALS.has(link.id));
  /** Counted from the data (FR-11), like the stats strip. */
  protected readonly stats: ProfileHeroStats = {
    organizations: experience.length,
    technologies: skills.length,
  };
  /** contact.json's time zone (Africa/Lagos) as people say it. */
  protected readonly timezone = 'WAT · UTC+1';

  /** The résumé modal comes with ETE-109; until then the hero's Résumé goes to the section. */
  protected openResume(): void {
    void this.router.navigate([], { fragment: 'resume' });
  }
}
