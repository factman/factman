import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import { Button } from '@ui/atoms/button/button';
import { Icon } from '@ui/atoms/icon/icon';
import { type IconDef } from '@ui/atoms/icon/icon-def';

/**
 * What shows when a list has nothing in it ("No projects match these filters"): an icon, a title,
 * a description and, with `actionLabel`, one button that emits `action` (e.g. "Clear filters").
 * @level molecule
 */
@Component({
  selector: 'fm-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './empty-state.scss',
  imports: [Button, Icon],
  host: { style: 'display: contents' },
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly icon = input.required<IconDef | string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly actionLabel = input<string>();
  /** A glass card around it, for use on the page background. */
  readonly card = input(false);

  readonly action = output<void>();
}
