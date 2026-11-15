import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Button, type ButtonSize, type ButtonVariant } from '../button/button';
import type { IconDef } from '../icon/icon-def';

/**
 * A square button with only an icon. `label` is required: it is the button's accessible name.
 * The hit area is at least 44 × 44px whatever the size.
 * @level atom
 */
@Component({
  selector: 'fm-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  host: { style: 'display: contents' },
  templateUrl: './icon-button.html',
})
export class IconButton {
  readonly icon = input.required<IconDef | string>();
  /** The accessible name, e.g. "Open menu". */
  readonly label = input.required<string>();
  readonly variant = input<ButtonVariant>('tertiary');
  readonly size = input<ButtonSize>('md');
  readonly href = input<string>();
  readonly newTab = input<boolean>();
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly toggled = input<boolean>();
  readonly ariaHaspopup = input<'dialog' | 'menu' | 'true'>();
  readonly ariaExpanded = input<boolean>();
  readonly ariaControls = input<string>();

  readonly pressed = output<MouseEvent>();
}
