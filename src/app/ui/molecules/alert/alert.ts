import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { Icon, IconButton, iconClose } from '@ui/atoms';

import { type FeedbackTone, TONE_ICON } from './alert-tone';

/**
 * A message in the page about something the visitor should know: a form that didn't send, a
 * notice. The tone's icon and the title carry the meaning; the body is the projected content.
 * Warning and danger alerts are `role="alert"` (read out at once); the rest are `role="status"`.
 * @level molecule
 */
@Component({
  selector: 'fm-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './alert.scss',
  imports: [Icon, IconButton],
  host: { style: 'display: contents' },
  templateUrl: './alert.html',
})
export class Alert {
  readonly tone = input<FeedbackTone>('info');
  readonly title = input<string>();
  /** Shows a close button that emits `dismissed`. */
  readonly dismissible = input(false);
  /** Glass surface instead of the tone's tint. */
  readonly glass = input(false);

  readonly dismissed = output<void>();

  protected readonly close = iconClose;
  protected readonly icon = computed(() => TONE_ICON[this.tone()]);
  protected readonly role = computed(() =>
    this.tone() === 'warning' || this.tone() === 'danger' ? 'alert' : 'status',
  );
  protected readonly classes = computed(() => {
    const c = ['fm-alert', 'fm-alert--expanded', `fm-tone--${this.tone()}`];
    if (this.glass()) c.push('fm-alert--glass');
    return c.join(' ');
  });
}
