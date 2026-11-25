import { EnvironmentInjector, importProvidersFrom, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Route } from '@angular/router';
import { RenderMode } from '@angular/ssr';
import { CoreModule } from '@core';
import { projects } from '@data/projects';
import { services } from '@data/services';
import { PROJECTS_ROUTES } from '@features/projects';
import { SERVICES_ROUTES } from '@features/services';

import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

/** Every client path, with the lazy services and projects children joined to their parent. */
const clientPaths = (): string[] => {
  const children: Record<string, Route[]> = {
    services: SERVICES_ROUTES,
    projects: PROJECTS_ROUTES,
  };
  return routes.flatMap((r) =>
    children[r.path!]
      ? children[r.path!].map((c) => [r.path, c.path].filter(Boolean).join('/'))
      : [r.path!],
  );
};

describe('server routes (FR-01, ETE-115)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(CoreModule.forRoot({ environment: 'production' }))],
    }),
  );

  /** The params a server route prerenders, read in the app's injector like the build does. */
  const params = async (path: string) => {
    const route = serverRoutes.find((r) => r.path === path);
    const get = route && 'getPrerenderParams' in route ? route.getPrerenderParams : undefined;
    if (!get) throw new Error(`${path} has no prerender params`);
    return runInInjectionContext(TestBed.inject(EnvironmentInjector), () => get());
  };

  it('prerenders every client route', () => {
    const server = serverRoutes.map((r) => r.path);
    for (const path of clientPaths()) expect(server, path).toContain(path);
    expect(serverRoutes.every((r) => r.renderMode === RenderMode.Prerender)).toBe(true);
  });

  it('prerenders one page per service in services.json', async () => {
    expect(await params('services/:slug')).toEqual(services.map((s) => ({ slug: s.slug })));
  });

  it('prerenders one page per project in projects.json', async () => {
    // The repository lists them newest first; every project is there exactly once.
    const slugs = (await params('projects/:slug')).map((p) => p['slug']);
    expect(slugs.sort()).toEqual(projects.map((p) => p.slug).sort());
  });
});
