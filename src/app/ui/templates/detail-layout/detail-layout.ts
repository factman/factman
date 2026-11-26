import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Breadcrumbs, type Crumb } from '@ui/molecules/breadcrumbs/breadcrumbs';

/**
 * The service and project detail pages (canvas TemplateDetail): breadcrumbs, then the hero
 * (`[detailHero]`: title block, lead, actions), an optional gallery (`[detailGallery]`), the body
 * (`[detailBody]`, 8 columns) beside a side card that stays in view (`[detailAside]`, 4 columns:
 * BookingCard or EngageCard), a call to action (`[detailCta]`) and related items
 * (`[detailRelated]`). Slots left empty take no space. On tablets and phones the aside follows
 * the body.
 * @level template
 */
@Component({
  selector: 'fm-detail-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './detail-layout.scss',
  imports: [Breadcrumbs],
  host: { style: 'display: contents' },
  templateUrl: './detail-layout.html',
})
export class DetailLayout {
  /** The trail above the hero; the last crumb is this page. */
  readonly crumbs = input<readonly Crumb[]>([]);
}
