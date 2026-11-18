import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * A coloured dot with its status in words beside it ("Available", "Busy"). The words are the
 * meaning, so `label` is required and always visible; the colour only reinforces it.
 * `pulse` adds a slow ring for live states; it stops with reduced motion.
 * @level atom
 */
@Component({
  selector: 'fm-status-dot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './status-dot.scss',
  host: { style: 'display: contents' },
  template: `<span class="fm-status fm-tone--{{ tone() }}" [class.is-pulsing]="pulse()">
    <span class="fm-status-dot" aria-hidden="true"></span>{{ label() }}
  </span>`,
})
export class StatusDot {
  /** The status in words. */
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('success');
  readonly pulse = input(false);
}
