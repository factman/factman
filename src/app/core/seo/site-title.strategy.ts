import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SITE } from '../config/site';

/**
 * Page titles from the route `title`: "Services · Odunayo Mohammed" through `site.titleTemplate`.
 * A route without a title (the home page) gets the site name alone.
 */
@Injectable()
export class SiteTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly site = inject(SITE);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? this.site.titleTemplate.replace('%s', page) : this.site.name);
  }
}
