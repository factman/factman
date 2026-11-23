import type { Routes } from '@angular/router';
import type { PageSeo } from '@core/seo';

/** The not-found page's head: never indexed, and no canonical URL (ETE-112). */
const NOT_FOUND_SEO: PageSeo = {
  description:
    'This page does not exist. Find projects, services and articles by Odunayo Mohammed from here.',
  robots: 'noindex',
};

/**
 * Site map (PRD §4): home, three lists, two details, privacy and not-found. Every page is lazy;
 * the services and projects features bring their own child routes (and data) with them.
 */
export const routes: Routes = [
  {
    // No title or seo: the home page has the site name and description (SiteTitleStrategy).
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
    data: {
      seo: {
        description:
          'Articles by Odunayo Mohammed on software engineering, technical leadership and building products, published on Medium.',
      } satisfies PageSeo,
    },
    loadComponent: () => import('@features/blog').then((m) => m.BlogPage),
  },
  {
    path: 'privacy',
    title: 'Privacy',
    data: {
      seo: {
        description:
          'How factman.dev handles your data: the cookies it sets, the analytics it runs only with your consent, and how to change your choice.',
      } satisfies PageSeo,
    },
    loadComponent: () => import('@features/legal').then((m) => m.PrivacyPage),
  },
  {
    path: '404',
    title: 'Page not found',
    data: { seo: NOT_FOUND_SEO },
    loadComponent: () => import('@features/not-found').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    title: 'Page not found',
    data: { seo: NOT_FOUND_SEO },
    loadComponent: () => import('@features/not-found').then((m) => m.NotFoundPage),
  },
];
