import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { StatusDot } from '@ui/atoms';

export type Availability = 'available' | 'busy';

const DEFAULT_LABEL: Record<Availability, string> = {
  available: 'Available for new projects',
  busy: 'Booked for now',
};

/**
 * Whether Odunayo is taking new work, as a glass pill: a status dot and the words
 * (profile.json `availability`; the page passes them). Available pulses green; busy is amber and
 * still. The words carry the meaning; the pulse stops with reduced motion.
 * @level molecule
 */
@Component({
  selector: 'fm-availability-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './availability-badge.scss',
  imports: [StatusDot],
  host: { style: 'display: contents' },
  template: `<span class="availability">
    <fm-status-dot
      [label]="text()"
      [tone]="status() === 'available' ? 'success' : 'warning'"
      [pulse]="status() === 'available'"
    />
  </span>`,
})
export class AvailabilityBadge {
  readonly status = input<Availability>('available');
  /** The words, e.g. profile.availability.message. Defaults by status. */
  readonly label = input<string>();

  protected readonly text = computed(() => this.label() ?? DEFAULT_LABEL[this.status()]);
}
