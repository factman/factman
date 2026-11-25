import { Directive, inject, input } from '@angular/core';

import type { AnalyticsEvent } from './analytics-events';
import { ANALYTICS_TRACKER } from './tracker';

/**
 * Sends an analytics event when the element is clicked (or activated from the keyboard, which
 * clicks it): `<a [fmTrack]="{ name: 'blog_click', params: { post_id, location: 'home' } }">`.
 * The event is typed against the catalogue, so a wrong name or parameter fails the template
 * check. It never stops the click.
 */
@Directive({
  selector: '[fmTrack]',
  host: { '(click)': 'send()' },
})
export class Track {
  readonly fmTrack = input.required<AnalyticsEvent | null>();
  private readonly tracker = inject(ANALYTICS_TRACKER);

  protected send(): void {
    const event = this.fmTrack();
    if (event) this.tracker.track(event.name, event.params as never);
  }
}
