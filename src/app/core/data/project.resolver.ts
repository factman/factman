import { inject } from '@angular/core';
import { RedirectCommand, type ResolveFn, Router } from '@angular/router';
import type { PageSeo } from '@core/seo';
import type { Project } from '@shared';

import { ProjectsRepository } from './projects.repository';
import { NOT_FOUND_PATH } from './service.resolver';

/**
 * Resolves `:slug` to its project for /projects/:slug. An unknown slug shows the not-found page
 * without changing the address bar. Every known slug is prerendered, so this only matters for
 * client-side navigation.
 */
export const projectResolver: ResolveFn<Project> = (route) => {
  const project = inject(ProjectsRepository).bySlug(route.paramMap.get('slug') ?? '');
  if (project) return project;
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl(NOT_FOUND_PATH), { skipLocationChange: true });
};

/** Page title for /projects/:slug: the project's title (an unknown slug is redirected anyway). */
export const projectTitleResolver: ResolveFn<string> = (route) =>
  inject(ProjectsRepository).bySlug(route.paramMap.get('slug') ?? '')?.title ?? 'Page not found';

/** Search and link-preview tags for /projects/:slug, from the project (ETE-112). */
export const projectSeoResolver: ResolveFn<PageSeo | undefined> = (route) => {
  const project = inject(ProjectsRepository).bySlug(route.paramMap.get('slug') ?? '');
  return project && { description: project.summary, type: 'article' };
};
