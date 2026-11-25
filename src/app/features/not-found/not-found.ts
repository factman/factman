import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { profile } from '@data/profile';
import { portraitSources } from '@shared';
import { NotFoundSection, type NotFoundSuggestion } from '@ui/organisms';

/** Pages offered on the not-found page, after "Go home" (NotFoundSection artboard). */
export const NOT_FOUND_SUGGESTIONS: readonly NotFoundSuggestion[] = [
  { label: 'Projects', href: '/projects' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
];

/**
 * Not-found page (FR-05): /404, any unknown URL, and unknown slugs on the detail routes (their
 * resolvers show this page and keep the address). Prerendered as 404.html, which the host serves
 * with a 404 status for every path it has no page for. Never indexed: its route sets `seo.robots`
 * to noindex (app.routes.ts).
 * @level page
 */
@Component({
  selector: 'fm-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundSection],
  template: `<fm-not-found-section [path]="path" [suggestions]="suggestions" [photo]="photo" />`,
})
export class NotFoundPage {
  /** The address the visitor asked for: the browser's, since resolvers keep it. */
  protected readonly path = inject(Location).path() || '/404';
  protected readonly suggestions = NOT_FOUND_SUGGESTIONS;
  protected readonly photo = profile.notFoundPhoto && portraitSources(profile.notFoundPhoto);
}
