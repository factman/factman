import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Service } from '@shared';
import { Button } from '@ui/atoms/button/button';
import { Icon } from '@ui/atoms/icon/icon';
import { iconArrowRight } from '@ui/atoms/icon/icons';

/**
 * A service offered: icon, title and summary. Without `href` it ends with a "Get a quote" button
 * to the contact page for that service. With `href` it is the canvas ServiceTile: the whole card
 * links to the service page and the footer lists the first deliverables. `current` highlights the
 * service being viewed. The icon is chosen by data (`service.icon`), so the page registers it.
 * @level molecule
 */
@Component({
  selector: 'fm-service-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './service-card.scss',
  imports: [Button, Icon, RouterLink],
  host: { style: 'display: contents' },
  templateUrl: './service-card.html',
})
export class ServiceCard {
  readonly service =
    input.required<Pick<Service, 'slug' | 'title' | 'summary' | 'icon' | 'deliverables'>>();
  /** The service's page; makes the card a ServiceTile. */
  readonly href = input<string>();
  readonly current = input(false);
  readonly headingLevel = input<2 | 3>(3);
  /** How many deliverables the tile lists. */
  readonly deliverableCount = input(3);

  protected readonly arrow = iconArrowRight;
  protected readonly quoteHref = computed(() => `/contact?service=${this.service().slug}`);
  protected readonly deliverables = computed(() =>
    this.service().deliverables.slice(0, this.deliverableCount()),
  );
}
