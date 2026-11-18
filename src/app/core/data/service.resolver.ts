import { inject } from '@angular/core';
import { RedirectCommand, type ResolveFn, Router } from '@angular/router';
import type { Service } from '@shared';

import { ServicesRepository } from './services.repository';

/** Path of the not-found page that unknown slugs are sent to (the URL stays as typed). */
export const NOT_FOUND_PATH = '/404';

/**
 * Resolves `:slug` to its service for /services/:slug. An unknown slug shows the not-found page
 * without changing the address bar. Every known slug is prerendered, so this only matters for
 * client-side navigation.
 */
export const serviceResolver: ResolveFn<Service> = (route) => {
  const service = inject(ServicesRepository).bySlug(route.paramMap.get('slug') ?? '');
  if (service) return service;
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl(NOT_FOUND_PATH), { skipLocationChange: true });
};

/** Page title for /services/:slug: the service's title (an unknown slug is redirected anyway). */
export const serviceTitleResolver: ResolveFn<string> = (route) =>
  inject(ServicesRepository).bySlug(route.paramMap.get('slug') ?? '')?.title ?? 'Page not found';
