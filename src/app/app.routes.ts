import type { Routes } from '@angular/router';

/**
 * Site map (PRD §4): home, three lists, two details, privacy and not-found. Every page is lazy;
 * the services and projects features bring their own child routes (and data) with them.
 */
export const routes: Routes = [
  {
    // No title: the home page is titled with the site name alone (SiteTitleStrategy).
    path: '',
    loadComponent: () => import('@features/home').then((m) => m.Home),
  },
  {
    path: 'services',
    loadChildren: () => import('@features/services').then((m) => m.SERVICES_ROUTES),
  },
  {
    path: 'projects',
    loadChildren: () => import('@features/projects').then((m) => m.PROJECTS_ROUTES),
  },
  {
    path: 'blog',
    title: 'Blog',
    loadComponent: () => import('@features/blog').then((m) => m.BlogPage),
  },
  {
    path: 'privacy',
    title: 'Privacy',
    loadComponent: () => import('@features/legal').then((m) => m.PrivacyPage),
  },
  {
    path: '404',
    title: 'Page not found',
    loadComponent: () => import('@features/not-found').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('@features/not-found').then((m) => m.NotFoundPage),
  },
];
