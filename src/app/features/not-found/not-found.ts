import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

/**
 * Not-found page: /404 (prerendered) and any unknown URL. Never indexed.
 * @level page
 */
@Component({
  selector: 'fm-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Page not found</h1>
    <p><a routerLink="/">Go to the home page</a></p>
  `,
})
export class NotFoundPage {
  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex' });
  }
}
