import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BlogRepository,
  ClientsRepository,
  ProjectsRepository,
  ServicesRepository,
} from '@core/data';
import { contact } from '@data/contact';
import { experience } from '@data/experience';
import { heroCodeFile } from '@data/generated/hero-code';
import { profile } from '@data/profile';
import { skills } from '@data/skills';
import { ThemeService } from '@core/theme';
import { CLOCK, countWord, portraitSources, SharedModule, yearsSince } from '@shared';
import { Button, IconRegistry, iconArrowRight, iconGithub } from '@ui/atoms';
import { CodeEditor, SERVICE_ICONS } from '@ui/molecules';
import {
  AboutSection,
  BlogFeed,
  ClientLogoStrip,
  ContactChannels,
  type ContactDetails,
  ContactForm,
  contactTopics,
  ExperienceTimeline,
  type HeroAction,
  ProfileHero,
  ProjectGallery,
  type ProfileHeroStats,
  ServicesGrid,
  TechStack,
} from '@ui/organisms';
import { SectionLayout } from '@ui/templates';

import { aboutFacts } from './about-facts';
import { careerGlance, darkLogos, timelineEntries } from './experience-view';
import { HOME_SECTIONS } from './home-sections';
import { stackGroups } from './stack-groups';

/** Sections this page renders itself; the rest are shells until their organisms are built. */
const BUILT = new Set<string>([
  'about',
  'resume',
  'stack',
  'experience',
  'services',
  'projects',
  'blog',
  'contact',
]);

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
    BlogFeed,
    Button,
    ClientLogoStrip,
    CodeEditor,
    ContactChannels,
    ContactForm,
    ExperienceTimeline,
    ProfileHero,
    ProjectGallery,
    RouterLink,
    SectionLayout,
    ServicesGrid,
    SharedModule,
    TechStack,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  /** The build's clock: every count on the page is fixed at prerender time. */
  private readonly now = inject(CLOCK)();

  /** "Worked with", in display order; an empty list omits the strip (FR-52). */
  protected readonly clients = inject(ClientsRepository).all();

  protected readonly sections = HOME_SECTIONS.filter((s) => !BUILT.has(s.id));
  /** The Logo plate on the About portrait follows the theme. */
  protected readonly theme = inject(ThemeService, { optional: true })?.theme ?? signal('light');

  /** About (FR-10): the years are counted from careerStart at build time. */
  protected readonly about = {
    title: 'Engineer first, leader by practice',
    description: `${yearsSince(profile.careerStart, this.now)} years of shipping software, from the first commit to the team that maintains it.`,
  };
  protected readonly aboutPhoto = profile.aboutPhoto && {
    ...portraitSources(profile.aboutPhoto),
    sizes: '(min-width: 768px) 480px, 360px',
  };
  protected readonly aboutFacts = aboutFacts(profile);

  /** Stack (FR-11, FR-12): years of use are counted from each skill's `since` at build time. */
  protected readonly stack = stackGroups(skills, this.now);

  /** Experience (FR-13 to FR-16) and CareerGlance, from experience.json. */
  protected readonly timeline = timelineEntries(
    experience,
    skills,
    this.now,
    darkLogos(this.clients),
  );
  protected readonly glance = careerGlance(experience, profile.careerStart, this.now);

  /** Services in services.json `order`; their icons are chosen by the data (ADR-004). */
  protected readonly services = inject(ServicesRepository).all();
  protected readonly servicesIntro = `${countWord(this.services.length)} services, from a one-off architecture review to a fractional CTO. Every engagement starts with a short call and a written quote.`;

  /** Projects (FR-20): at most six featured, newest first. */
  protected readonly projects = inject(ProjectsRepository).featured();
  protected readonly projectLinks: HeroAction[] = [
    { label: 'See all projects', href: '/projects', trailingIcon: iconArrowRight },
    ...contact.links
      .filter((l) => l.id === 'github')
      .map((l) => ({ label: 'GitHub profile', href: l.url, leadingIcon: iconGithub })),
  ];

  /** Blog (FR-24): the newest three articles, read live from Medium after the page renders. */
  protected readonly blog = inject(BlogRepository);
  protected readonly blogTitle = `Lessons from ${yearsSince(profile.careerStart, this.now)} years of shipping software`;
  protected readonly blogArrow = iconArrowRight;

  /** Contact (FR-27): the form drafts an email to contact.json's address; nothing is sent. */
  protected readonly contactEmail = contact.email;
  protected readonly topics = contactTopics(this.services.map((s) => s.title));
  /** The channels beside the form (FR-29, FR-30): city and country only, never a street. */
  protected readonly contactDetails: ContactDetails = {
    email: contact.email,
    phone: contact.phone,
    whatsapp: `https://wa.me/${contact.whatsapp.number}?text=${encodeURIComponent(contact.whatsapp.message)}`,
    company: contact.links
      .filter((l) => l.id === 'eteam')
      .map((l) => ({ label: l.label, url: l.url }))[0],
    city: contact.city,
    country: contact.country,
    responseTime: contact.responseTime,
    timezone: 'WAT, UTC+1',
    availability: profile.availability.status === 'available' ? 'available' : 'busy',
    socials: contact.links.filter((link) => HERO_SOCIALS.has(link.id)),
  };
  protected readonly contactPhoto = profile.contactPhoto && {
    ...portraitSources(profile.contactPhoto),
    sizes: '(min-width: 1024px) 560px, 100vw',
  };

  constructor() {
    inject(IconRegistry).register(SERVICE_ICONS);
    afterNextRender(() => void this.blog.load());
  }

  /** A private project's "Request a walkthrough" goes to the contact section. */
  protected engage(): void {
    void this.router.navigate([], { fragment: 'contact' });
  }
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
