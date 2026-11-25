import { NgModule } from '@angular/core';
import { TitleStrategy } from '@angular/router';

import { SeoService } from './seo.service';
import { SiteTitleStrategy } from './site-title.strategy';

/**
 * Page titles, canonical URLs, description, robots, Open Graph and Twitter tags (ETE-112), written
 * after every navigation. Previews are `noindex` through `site.robots`; JSON-LD comes with ETE-113.
 */
@NgModule({
  providers: [SeoService, { provide: TitleStrategy, useClass: SiteTitleStrategy }],
})
export class SeoModule {}
