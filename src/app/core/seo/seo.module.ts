import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TitleStrategy } from '@angular/router';

import { SITE } from '../config/site';
import { SiteTitleStrategy } from './site-title.strategy';

/** Site-wide meta tags, written into every prerendered page. Previews are `noindex`. */
export function applySiteMeta(): void {
  const site = inject(SITE);
  const meta = inject(Meta);
  meta.updateTag({ name: 'description', content: site.description });
  meta.updateTag({ name: 'robots', content: site.robots });
}

/** Titles and site-wide meta tags. Per-page meta, Open Graph and JSON-LD build on this. */
@NgModule({
  providers: [
    { provide: TitleStrategy, useClass: SiteTitleStrategy },
    provideAppInitializer(applySiteMeta),
  ],
})
export class SeoModule {}
