import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ClientsRepository } from '@core/data';
import { contact } from '@data/contact';
import { experience } from '@data/experience';
import { heroCodeFile } from '@data/generated/hero-code';
import { profile } from '@data/profile';
import { skills } from '@data/skills';
import { ThemeService } from '@core/theme';
import { CLOCK, portraitSources, SharedModule, yearsSince } from '@shared';
import { CodeEditor } from '@ui/molecules';
import { AboutSection, ClientLogoStrip, ProfileHero, type ProfileHeroStats } from '@ui/organisms';
import { SectionLayout } from '@ui/templates';

import { aboutFacts } from './about-facts';
import { HOME_SECTIONS } from './home-sections';

/** Sections this page renders itself; the rest are shells until their organisms are built. */
const BUILT = new Set<string>(['about', 'resume']);

/** The networks the hero links to, in contact.json's order (ETeam has its own place). */
const HERO_SOCIALS = new Set(['github', 'linkedin', 'x', 'medium']);

/**
 * Home page (/): the profile hero (#top), "Worked with", About (#about, with #resume inside it),
 * then one section per anchor. The remaining sections are shells until their organisms are built.
 * @level page
 */
@Component({
  selector: 'fm-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AboutSection,
    ClientLogoStrip,
    CodeEditor,
    ProfileHero,
    RouterLink,
    SectionLayout,
    SharedModule,
  ],
  templateUrl: './home.html',
})
export class Home {
  private readonly router = inject(Router);

  /** "Worked with", in display order; an empty list omits the strip (FR-52). */
  protected readonly clients = inject(ClientsRepository).all();

  protected readonly sections = HOME_SECTIONS.filter((s) => !BUILT.has(s.id));
  /** The Logo plate on the About portrait follows the theme. */
  protected readonly theme = inject(ThemeService, { optional: true })?.theme ?? signal('light');

  /** About (FR-10): the years are counted from careerStart at build time. */
  protected readonly about = {
    title: 'Engineer first, leader by practice',
    description: `${yearsSince(profile.careerStart, inject(CLOCK)())} years of shipping software, from the first commit to the team that maintains it.`,
  };
  protected readonly aboutPhoto = profile.aboutPhoto && {
    ...portraitSources(profile.aboutPhoto),
    sizes: '(min-width: 768px) 480px, 360px',
  };
  protected readonly aboutFacts = aboutFacts(profile);
  protected readonly profile = profile;
  protected readonly photo = portraitSources(profile.photo);
  /** The hero's profile.ts, highlighted at build time (pnpm data:hero-code); it repeats the hero's
   * text, so the editor is decorative. */
  protected readonly editorFiles = [heroCodeFile];
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
