import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsRepository } from '@core/data';
import { contact } from '@data/contact';
import { profile } from '@data/profile';
import { portraitSources, type Project } from '@shared';
import { iconArrowRight, iconGithub } from '@ui/atoms';
import {
  CtaBanner,
  fromQueryParams,
  type HeroAction,
  PageHero,
  ProjectGallery,
  type ProjectFilter,
  toQueryParams,
} from '@ui/organisms';
import { map } from 'rxjs';

const GITHUB = contact.links.find((l) => l.id === 'github')?.url;

/**
 * Projects gallery (/projects, FR-20, FR-21): PageHero, every project newest first with the
 * status, category and search filters, and "Building something similar?". The filter lives in the
 * URL query (`?status=maintained&category=Web&q=api`), so a filtered list can be shared and the
 * back button restores it. A private project's "Request a walkthrough" goes to the contact section.
 * @level page
 */
@Component({
  selector: 'fm-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CtaBanner, PageHero, ProjectGallery],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly projects = inject(ProjectsRepository).all();
  protected readonly filter = toSignal(this.route.queryParamMap.pipe(map(fromQueryParams)), {
    initialValue: fromQueryParams(this.route.snapshot.queryParamMap),
  });

  protected readonly crumbs = [{ label: 'Home', href: '/' }, { label: 'Projects' }];
  /** The canvas's Projects hero: the desk photo, framed (16:9). */
  protected readonly media = profile.projectsPhoto && {
    ...portraitSources(profile.projectsPhoto),
    framed: true,
    sizes: '(min-width: 1024px) 560px, 100vw',
  };
  /** The CtaBanner's portrait. */
  protected readonly ctaPhoto = profile.ctaPhoto && {
    ...portraitSources(profile.ctaPhoto),
    sizes: '(min-width: 1024px) 320px, 240px',
  };
  protected readonly ctaActions: HeroAction[] = [
    { label: 'Book a service', href: '/services', trailingIcon: iconArrowRight },
    ...(GITHUB ? [{ label: 'GitHub', href: GITHUB, leadingIcon: iconGithub }] : []),
  ];

  /** Keeps the filter in the URL without adding a history entry per keystroke. */
  protected setFilter(filter: ProjectFilter): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(filter),
      replaceUrl: true,
    });
  }

  protected engage(project: Project): void {
    void this.router.navigate(['/'], { fragment: 'contact', state: { project: project.slug } });
  }
}
