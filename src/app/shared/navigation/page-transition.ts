import { DOCUMENT, inject } from '@angular/core';
import type { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';

import { prefersReducedMotion } from '../motion/reduced-motion';

/** The deepest route of a router state: the page actually shown. */
function leaf(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let r = route;
  while (r.firstChild) r = r.firstChild;
  return r;
}

/**
 * Whether two router states show the same page: same route and path parameters, so only the
 * query or fragment changed (the projects filters, a jump to a home section).
 */
export function samePage(from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot): boolean {
  const a = leaf(from);
  const b = leaf(to);
  if (a.routeConfig !== b.routeConfig) return false;
  const keys = new Set([...Object.keys(a.params), ...Object.keys(b.params)]);
  return [...keys].every((k) => a.params[k] === b.params[k]);
}

/**
 * Page transitions (ETE-266): the router crossfades between pages with the View Transitions API
 * (`withViewTransitions`). Skipped for query- or fragment-only changes, which aren't a new page,
 * and under reduced motion, so nothing moves or fades for those visitors. Runs in an injection
 * context. Focus still goes to <main> after navigation (app.ts), which the transition doesn't
 * change.
 */
export function pageTransition({ transition, from, to }: ViewTransitionInfo): void {
  const win = inject(DOCUMENT).defaultView;
  if (prefersReducedMotion(win ?? undefined) || samePage(from, to)) transition.skipTransition();
}
