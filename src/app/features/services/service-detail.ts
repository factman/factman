import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Service } from '@shared';

/**
 * One service (/services/:slug), resolved by `serviceResolver`. Shell until the design is built.
 * @level page
 */
@Component({
  selector: 'fm-service-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>{{ service().title }}</h1>
    <p>{{ service().summary }}</p>
    <p><a routerLink="/services">All services</a></p>
  `,
})
export class ServiceDetailPage {
  /** Bound from the route's resolved `service` data (withComponentInputBinding). */
  readonly service = input.required<Service>();
}
