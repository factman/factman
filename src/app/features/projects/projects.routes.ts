import { inject } from '@angular/core';
import { RedirectCommand, Router, type Routes } from '@angular/router';
import { NOT_FOUND_PATH } from '@core/data';

/**
 * /projects and /projects/:slug. Until projects.json lands (ETE-31) there are no projects, so
 * every slug shows the not-found page; the detail page and its resolver arrive with the data.
 */
export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Projects',
    loadComponent: () => import('./projects').then((m) => m.ProjectsPage),
  },
  {
    path: ':slug',
    children: [],
    canActivate: [
      () =>
        new RedirectCommand(inject(Router).parseUrl(NOT_FOUND_PATH), { skipLocationChange: true }),
    ],
  },
];
