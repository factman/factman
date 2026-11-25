import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { ProjectsRepository } from '@core/data';
import { contact } from '@data/contact';
import { skills } from '@data/skills';
import { ANALYTICS_TRACKER, type Project } from '@shared';
import { iconActivity, iconCalendar, iconFolder, iconGlobe, iconLock } from '@ui/atoms';
import type { ListItem } from '@ui/molecules';
import { type HeroTag, PageHero, ProjectCaseStudy } from '@ui/organisms';

const STATUS: Record<Project['status'], { label: string; tone: HeroTag['tone'] }> = {
  completed: { label: 'Completed', tone: 'success' },
  'in-progress': { label: 'In progress', tone: 'info' },
  maintained: { label: 'Maintained', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

const ASK: Record<NonNullable<Project['engage']>['mode'], string> = {
  'request-access': 'Access request',
  'request-demo': 'Demo request',
  contact: 'Question',
};

/**
 * The prefilled message for a project's "Request access", "Request a demo" or "Ask about this
 * project" (FR-23): an email to Odunayo that names the project.
 */
export function engageMailto(project: Pick<Project, 'title' | 'engage'>, email: string): string {
  const kind = ASK[project.engage?.mode ?? 'contact'];
  const subject = encodeURIComponent(`${kind}: ${project.title}`);
  const body = encodeURIComponent(
    `Hi Odunayo,\n\nI saw ${project.title} on your portfolio and I'd like to know more.\n\nThanks,\n`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/**
 * One project (/projects/:slug, FR-22, FR-23), resolved by `projectResolver`: PageHero (category,
 * status, visibility, title, summary, role and start year) and the ProjectCaseStudy beside the
 * EngageCard. A private project shows no outbound links; asking about it opens a prefilled email.
 * @level page
 */
@Component({
  selector: 'fm-project-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHero, ProjectCaseStudy],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailPage {
  /** Bound from the route's resolved `project` data (withComponentInputBinding). */
  readonly project = input.required<Project>();

  private readonly all = inject(ProjectsRepository).all();
  private readonly tracker = inject(ANALYTICS_TRACKER);

  constructor() {
    // project_open for each project shown (the route reuses the page between projects).
    effect(() => {
      const p = this.project();
      this.tracker.track('project_open', {
        project_id: p.id,
        status: p.status,
        visibility: p.visibility,
      });
    });
  }
  private readonly skillName = new Map(skills.map((s) => [s.id, s.name]));

  protected readonly crumbs = computed(() => [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: this.project().title },
  ]);
  protected readonly tags = computed<HeroTag[]>(() => {
    const p = this.project();
    const status = STATUS[p.status];
    return [
      { label: status.label, tone: status.tone, dot: true },
      ...(p.visibility === 'private' ? [{ label: 'Private', icon: iconLock }] : []),
    ];
  });
  protected readonly meta = computed(() => {
    const p = this.project();
    return [...(p.role ? [p.role] : []), `Since ${p.startedAt.slice(0, 4)}`];
  });
  protected readonly media = computed(() => {
    const p = this.project();
    return p.cover
      ? { src: `/assets/${p.cover}`, alt: `${p.title}`, width: 1280, height: 800, framed: true }
      : undefined;
  });
  protected readonly stack = computed(() =>
    this.project().stack.map((id) => this.skillName.get(id) ?? id),
  );
  protected readonly facts = computed<ListItem[]>(() => {
    const p = this.project();
    return [
      { title: 'Status', value: STATUS[p.status].label, icon: iconActivity },
      {
        title: 'Visibility',
        value: p.visibility === 'public' ? 'Public' : 'Private',
        icon: iconGlobe,
      },
      { title: 'Category', value: p.category, icon: iconFolder },
      { title: 'Started', value: p.startedAt.slice(0, 4), icon: iconCalendar },
    ];
  });
  /** The next project in the gallery's order (newest first), wrapping round. */
  protected readonly next = computed(() => {
    const at = this.all.findIndex((p) => p.slug === this.project().slug);
    const next = this.all[(at + 1) % this.all.length];
    return next && next.slug !== this.project().slug
      ? { title: next.title, href: `/projects/${next.slug}` }
      : undefined;
  });

  protected requestAccess(): void {
    const p = this.project();
    this.tracker.track('project_access_request', {
      project_id: p.id,
      mode: p.engage?.mode ?? 'contact',
    });
    globalThis.location?.assign(engageMailto(p, contact.email));
  }
}
