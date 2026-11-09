import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every route is prerendered at build time (FR-01).
 * The full route list (services/:slug, projects/:slug, …) arrives with ETE-43;
 * for now only the home route is emitted.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender },
];
