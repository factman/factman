import type { Routes } from '@angular/router';
import { serviceResolver, serviceTitleResolver } from '@core/data';

/** /services and /services/:slug, loaded lazily so services.json ships only with these pages. */
export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    title: 'Services',
    loadComponent: () => import('./services').then((m) => m.ServicesPage),
  },
  {
    path: ':slug',
    title: serviceTitleResolver,
    resolve: { service: serviceResolver },
    loadComponent: () => import('./service-detail').then((m) => m.ServiceDetailPage),
  },
];
