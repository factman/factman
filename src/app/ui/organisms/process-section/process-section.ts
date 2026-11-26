import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { type Step, Stepper } from '@ui/molecules/stepper/stepper';

/**
 * How an engagement runs (the canvas's ProcessSection body): the numbered steps across a glass
 * panel. Below 768px the panel scrolls sideways (as in the canvas), so it is a focusable,
 * labelled region that keyboard users can scroll. The page wraps it in SectionLayout and passes
 * the steps (the Services page's general process, or a service's own `process`).
 * @level organism
 */
@Component({
  selector: 'fm-process-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // process-section* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './process-section.scss',
  imports: [Stepper],
  host: { style: 'display: contents' },
  template: `<div class="process-section" role="region" [attr.aria-label]="label()" tabindex="0">
    <fm-stepper [steps]="steps()" orientation="horizontal" />
  </div>`,
})
export class ProcessSection {
  readonly steps = input.required<readonly Step[]>();
  /** The panel's accessible name. */
  readonly label = input('Process steps');
}
