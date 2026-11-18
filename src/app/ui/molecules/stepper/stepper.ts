import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Icon, iconCheck } from '@ui/atoms';

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'error';

export interface Step {
  title: string;
  description?: string;
  /** Progress through a flow. Leave it out for a process overview, where every step is equal. */
  status?: StepStatus;
}

/**
 * Numbered steps: how a project runs (Discover, Design, Build, Launch), or progress through a flow.
 * An ordered list; the current step has `aria-current="step"`, and a completed step shows a tick
 * with "Completed" for screen readers.
 * @level molecule
 */
@Component({
  selector: 'fm-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './stepper.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  templateUrl: './stepper.html',
})
export class Stepper {
  readonly steps = input.required<readonly Step[]>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  protected readonly check = iconCheck;
}
