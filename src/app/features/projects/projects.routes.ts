import type { Routes } from '@angular/router';
import { projectResolver, projectTitleResolver } from '@core/data';

/** /projects and /projects/:slug, loaded lazily so projects.json ships only with these pages. */
export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Projects',
    loadComponent: () => import('./projects').then((m) => m.ProjectsPage),
  },
  {
    path: ':slug',
    title: projectTitleResolver,
    resolve: { project: projectResolver },
    loadComponent: () => import('./project-detail').then((m) => m.ProjectDetailPage),
  },
];
