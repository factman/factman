import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicesRepository } from '@core/data';

/**
 * Services catalogue (/services). Shell until the services page design is built.
 * @level page
 */
@Component({
  selector: 'fm-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Services</h1>
    <ul>
      @for (service of services; track service.slug) {
        <li>
          <a [routerLink]="['/services', service.slug]">{{ service.title }}</a>
          <p>{{ service.summary }}</p>
        </li>
      }
    </ul>
  `,
})
export class ServicesPage {
  protected readonly services = inject(ServicesRepository).all();
}
