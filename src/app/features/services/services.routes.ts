import type { Routes } from '@angular/router';
import type { PageSeo } from '@core/seo';
import { serviceResolver, serviceSeoResolver, serviceTitleResolver } from '@core/data';

/** /services and /services/:slug, loaded lazily so services.json ships only with these pages. */
export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    title: 'Services',
    data: {
      seo: {
        description:
          'Consultancy, engineering, fintech and payments, technical leadership, DevOps, cloud and mobile development by Odunayo Mohammed.',
      } satisfies PageSeo,
    },
    loadComponent: () => import('./services').then((m) => m.ServicesPage),
  },
  {
    path: ':slug',
    title: serviceTitleResolver,
    resolve: { service: serviceResolver, seo: serviceSeoResolver },
    loadComponent: () => import('./service-detail').then((m) => m.ServiceDetailPage),
  },
];
