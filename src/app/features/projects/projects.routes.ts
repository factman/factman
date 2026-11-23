import type { Routes } from '@angular/router';
import type { PageSeo } from '@core/seo';
import { projectResolver, projectSeoResolver, projectTitleResolver } from '@core/data';

/** /projects and /projects/:slug, loaded lazily so projects.json ships only with these pages. */
export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Projects',
    data: {
      seo: {
        description:
          'Web, mobile and payment products built by Odunayo Mohammed, with the stack, role and outcome of each project.',
      } satisfies PageSeo,
    },
    loadComponent: () => import('./projects').then((m) => m.ProjectsPage),
  },
  {
    path: ':slug',
    title: projectTitleResolver,
    resolve: { project: projectResolver, seo: projectSeoResolver },
    loadComponent: () => import('./project-detail').then((m) => m.ProjectDetailPage),
  },
];
