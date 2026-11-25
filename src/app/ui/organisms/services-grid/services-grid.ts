import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { ctaEvent, type Service, Track } from '@shared';
import { Button, iconArrowRight } from '@ui/atoms';
import { ServiceCard } from '@ui/molecules';

/** What a tile needs of a service. */
export type GridService = Pick<Service, 'slug' | 'title' | 'summary' | 'icon' | 'deliverables'>;

/**
 * The services after `current`, wrapping round, without it: "Often booked together" on a
 * service's page starts with the next service rather than always the first.
 */
export function relatedServices<T extends { slug: string }>(
  services: readonly T[],
  current: string,
): T[] {
  const at = services.findIndex((s) => s.slug === current);
  if (at < 0) return [...services];
  return [...services.slice(at + 1), ...services.slice(0, at)];
}

/**
 * The services as ServiceTiles (ServiceCard with a link to `/services/:slug`) in a grid of four,
 * in the order given (services.json `order`), with an optional call to action under it ("Compare
 * all services"). With `current` it lists the other services, starting after that one (the
 * detail page's "Often booked together"). The page wraps it in SectionLayout (`#services`) and
 * registers SERVICE_ICONS.
 * @level organism
 */
@Component({
  selector: 'fm-services-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // services-grid* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './services-grid.scss',
  imports: [Button, ServiceCard, Track],
  host: { style: 'display: contents' },
  templateUrl: './services-grid.html',
})
export class ServicesGrid {
  /** A call to action's `cta_click` event. */
  protected readonly cta = ctaEvent;

  readonly services = input.required<readonly GridService[]>();
  /** Shows at most this many. */
  readonly limit = input<number>();
  /** A service's slug: list the others, starting after it. */
  readonly current = input<string>();
  /** The call to action under the grid; left out without a label. */
  readonly ctaLabel = input<string>();
  readonly ctaHref = input('/services');
  readonly headingLevel = input<2 | 3>(3);

  protected readonly arrow = iconArrowRight;
  protected readonly shown = computed(() => {
    const current = this.current();
    const list = current ? relatedServices(this.services(), current) : this.services();
    const limit = this.limit();
    return limit === undefined ? list : list.slice(0, limit);
  });
}
