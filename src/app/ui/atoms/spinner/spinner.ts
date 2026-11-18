import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { Logo } from '../logo/logo';
import { spinnerRing } from './ring';

export type SpinnerTone = 'default' | 'subtle' | 'inverse' | 'current';

/**
 * A loading indicator: the design system's ring, or the logo mark inside the ring for page loads.
 * It is a polite live region that reads `label` ("Loading"). With reduced motion the ring stops.
 * @level atom
 */
@Component({
  selector: 'fm-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './spinner.scss',
  imports: [Logo],
  host: { style: 'display: contents' },
  templateUrl: './spinner.html',
})
export class Spinner {
  readonly type = input<'ring' | 'logo'>('ring');
  /** Width and height in px. */
  readonly size = input(24);
  readonly tone = input<SpinnerTone>('default');
  /** What assistive tech hears. */
  readonly label = input('Loading');

  protected readonly ring = computed(() => spinnerRing(this.size()));
  /** The logo mark fills the middle of the ring. */
  protected readonly logoSize = computed(() => Math.round(this.size() * 0.56));
}
