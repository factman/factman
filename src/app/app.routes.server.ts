import { inject } from '@angular/core';
import { RenderMode, type ServerRoute } from '@angular/ssr';
import { ServicesRepository } from '@core/data';

/**
 * Every route is prerendered at build time (FR-01), including each detail slug. Project slugs
 * join the list with projects.json (ETE-31).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'services', renderMode: RenderMode.Prerender },
  {
    path: 'services/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      inject(ServicesRepository)
        .slugs()
        .map((slug) => ({ slug })),
  },
  { path: 'projects', renderMode: RenderMode.Prerender },
  { path: 'projects/:slug', renderMode: RenderMode.Client },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender },
];
