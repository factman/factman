import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, Route, ViewTransitionInfo } from '@angular/router';

import { pageTransition, samePage } from './page-transition';

const list: Route = { path: 'projects' };
const detail: Route = { path: 'projects/:slug' };
const state = (routeConfig: Route, params: Record<string, string> = {}) =>
  ({
    firstChild: { routeConfig, params, firstChild: null },
    routeConfig: null,
    params: {},
  }) as unknown as ActivatedRouteSnapshot;

describe('page transitions (ETE-266)', () => {
  it('samePage: the same route and params is the same page, whatever the query', () => {
    expect(samePage(state(list), state(list))).toBe(true);
    expect(samePage(state(list), state(detail, { slug: 'a' }))).toBe(false);
    expect(samePage(state(detail, { slug: 'a' }), state(detail, { slug: 'b' }))).toBe(false);
    expect(samePage(state(detail, { slug: 'a' }), state(detail, { slug: 'a' }))).toBe(true);
  });

  const run = (from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot, reduced = false) => {
    const skipTransition = vi.fn();
    const win = { matchMedia: () => ({ matches: reduced }) };
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: win } }],
    });
    TestBed.runInInjectionContext(() =>
      pageTransition({
        transition: { skipTransition } as unknown as ViewTransition,
        from,
        to,
      } as ViewTransitionInfo),
    );
    return skipTransition;
  };

  it('crossfades between pages', () => {
    expect(run(state(list), state(detail, { slug: 'a' }))).not.toHaveBeenCalled();
  });

  it('skips a query- or fragment-only change', () => {
    expect(run(state(list), state(list))).toHaveBeenCalledOnce();
  });

  it('skips under reduced motion', () => {
    expect(run(state(list), state(detail, { slug: 'a' }), true)).toHaveBeenCalledOnce();
  });
});
