import { Injectable, inject } from '@angular/core';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';

import type { PageSeo } from './page-seo';
import { SeoService } from './seo.service';

/**
 * Runs after every navigation (and so for every prerendered page). Titles come from the route
 * `title`: "Services · Odunayo Mohammed" through `site.titleTemplate`; a route without one (the
 * home page) gets the site name alone. The rest of the head comes from the deepest route's
 * `data.seo` (static routes) or resolved `seo` (detail routes), through SeoService.
 */
@Injectable()
export class SiteTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.seo.update(
      { title: this.buildTitle(snapshot), seo: pageSeo(snapshot.root) },
      snapshot.url,
    );
  }
}

/** The `seo` of the deepest route that has one. */
function pageSeo(route: ActivatedRouteSnapshot): PageSeo | undefined {
  let seo: PageSeo | undefined;
  for (let r: ActivatedRouteSnapshot | null = route; r; r = r.firstChild) {
    seo = (r.data['seo'] as PageSeo | undefined) ?? seo;
  }
  return seo;
}
