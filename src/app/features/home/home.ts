import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HOME_SECTIONS } from './home-sections';

/**
 * Home page (/): one section per anchor. Shell until the section organisms are built.
 * @level page
 */
@Component({
  selector: 'fm-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Odunayo Mohammed</h1>
    <p>Site under construction.</p>
    @for (section of sections; track section.id) {
      <section [id]="section.id" [attr.aria-labelledby]="section.id + '-title'" tabindex="-1">
        <h2 [id]="section.id + '-title'">{{ section.label }}</h2>
        @if ('route' in section) {
          <p>
            <a [routerLink]="section.route">All {{ section.label.toLowerCase() }}</a>
          </p>
        }
      </section>
    }
  `,
})
export class Home {
  protected readonly sections = HOME_SECTIONS;
}
