import {
  afterNextRender,
  ChangeDetectionStrategy,
  DOCUMENT,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  BlogRepository,
  ClientsRepository,
  ProjectsRepository,
  ServicesRepository,
} from '@core/data';
import { SITE } from '@core/config';
import { StructuredData } from '@core/seo';
import { contact } from '@data/contact';
import { experience } from '@data/experience';
import { githubContributions } from '@data/generated/github-contributions';
import { heroCodeFile } from '@data/generated/hero-code';
import { resumeDownloads } from '@data/resume-downloads';
import { profile } from '@data/profile';
import { site } from '@data/site';
import { skills } from '@data/skills';
import { ThemeService } from '@core/theme';
import {
  ANALYTICS_TRACKER,
  CLOCK,
  countWord,
  portraitSources,
  ResumeLauncher,
  type ResumeSource,
  SharedModule,
  TERMINAL_ENABLED,
  TerminalLauncher,
  yearsSince,
} from '@shared';
import { Button, IconRegistry, iconArrowRight, iconGithub } from '@ui/atoms';
import { CodeEditor, RESUME_ICONS, SERVICE_ICONS } from '@ui/molecules';
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
  ResumePreviewModal,
  ResumeSection,
  ServicesGrid,
  StatsPanel,
  TechStack,
} from '@ui/organisms';
import { SectionLayout } from '@ui/templates';

import { aboutFacts } from './about-facts';
import { careerGlance, darkLogos, timelineEntries } from './experience-view';
import { stackGroups } from './stack-groups';
import { HOME_SECTIONS } from './home-sections';
import { watchSectionViews } from './section-views';
import { homeStructuredData } from './structured-data';
import { careerStrip, contributionGraph, statCounters } from './stats-view';

/** The networks the hero links to, in contact.json's order (ETeam has its own place). */
const HERO_SOCIALS = new Set(['github', 'linkedin', 'x', 'medium']);

/**
 * Home page (/), in canvas order: the profile hero (#top), "Worked with", About (#about, with
 * #resume inside it), Stack, Experience, Services, Projects, Stats, Blog and Contact, each at the
 * anchor the site navigation links to (home-sections.ts).
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
    ResumePreviewModal,
    ResumeSection,
    SectionLayout,
    ServicesGrid,
    SharedModule,
    StatsPanel,
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

  private readonly allProjects = inject(ProjectsRepository).all();

  /** Stats (FR-31, FR-32): every figure counted from the data; articles once Medium has loaded. */
  protected readonly statsCounters = computed(() =>
    statCounters(
      {
        experience,
        projects: this.allProjects,
        skills,
        articles: this.blog.posts().length,
      },
      profile.careerStart,
      this.now,
    ),
  );
  protected readonly strip = careerStrip(experience, profile.careerStart, this.now);
  /** FR-33 (P1): the GitHub graph from the weekly snapshot, when the flag is on and one exists. */
  protected readonly contributions = inject(SITE).features.contributionGraph
    ? contributionGraph(githubContributions)
    : undefined;

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
  /** The portrait beside the contact form's "Message ready". */
  protected readonly contactSentPhoto =
    profile.contactSentPhoto && portraitSources(profile.contactSentPhoto);

  constructor() {
    inject(IconRegistry).register([...SERVICE_ICONS, ...RESUME_ICONS]);
    inject(StructuredData).set(homeStructuredData(site, profile, contact));
    const destroyRef = inject(DestroyRef);
    // The header's and footer's résumé buttons (ResumeLauncher): once the page has rendered, and
    // again whenever one is pressed while it is showing.
    const rendered = signal(false);
    effect(() => {
      if (!rendered() || !this.launcher.request()) return;
      const request = untracked(() => this.launcher.take());
      const slug = request && (request.slug ?? this.resumes[0]?.slug);
      if (request && slug && this.resumes.some((r) => r.slug === slug)) {
        untracked(() => this.openResume(slug, request.source));
      }
    });
    afterNextRender(() => {
      void this.blog.load();
      this.openResumeFromLink();
      rendered.set(true);
      // section_view: each section once, the first time it is in view.
      const stop = watchSectionViews(
        this.document,
        HOME_SECTIONS.map((s) => s.id),
        (id) => this.tracker.track('section_view', { section_id: id }),
      );
      destroyRef.onDestroy(stop);
    });
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

  /** The hero's "Terminal" button, when the P1 terminal ships (FR-36). */
  protected readonly terminalEnabled = inject(TERMINAL_ENABLED);
  protected readonly terminal = inject(TerminalLauncher);

  /** Résumés (FR-43 to FR-47): resumes.json with the PDFs committed by `pnpm build:resumes`. */
  protected readonly resumes = resumeDownloads;
  protected readonly resumeOpen = signal(false);
  protected readonly resumeVariant = signal(this.resumes[0]?.slug ?? '');
  private readonly document = inject(DOCUMENT);
  private readonly tracker = inject(ANALYTICS_TRACKER);
  private readonly launcher = inject(ResumeLauncher);

  /** Preview a résumé: the hero's Résumé button (fullstack), a card's Preview, or CareerGlance's
   * "Get the résumé" (the one last shown, else the first). */
  protected openResume(slug: string, source: ResumeSource): void {
    this.resumeVariant.set(slug);
    this.resumeOpen.set(true);
    this.tracker.track('resume_preview_open', { resume_id: slug, source });
  }

  /** Another résumé chosen inside the preview. */
  protected switchResume(slug: string): void {
    const previous = this.resumeVariant();
    this.resumeVariant.set(slug);
    if (slug !== previous) {
      this.tracker.track('resume_variant_switch', {
        resume_id: slug,
        previous_resume_id: previous,
      });
    }
  }

  /** Download a résumé's PDF under the manifest's file name. */
  protected downloadResume(slug: string, source: ResumeSource): void {
    const resume = this.resumes.find((r) => r.slug === slug);
    if (!resume) return;
    this.tracker.track('resume_download', { resume_id: slug, source });
    const link = this.document.createElement('a');
    link.href = resume.file;
    link.download = resume.fileName;
    // In the document while it is clicked: WebKit doesn't always download from a detached link.
    link.hidden = true;
    this.document.body.append(link);
    link.click();
    link.remove();
  }

  /** A deep link `/#resume=<slug>` opens that résumé's preview on load (FR-47). */
  private openResumeFromLink(): void {
    const slug = /^#resume=([\w-]+)$/.exec(this.document.location?.hash ?? '')?.[1];
    if (slug && this.resumes.some((r) => r.slug === slug)) this.openResume(slug, 'link');
  }
}
