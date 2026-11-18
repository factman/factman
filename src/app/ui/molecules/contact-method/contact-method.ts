import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { Icon, type IconDef } from '@ui/atoms';

import { CopyButton } from '../copy-button/copy-button';

/**
 * One way to reach Odunayo: an icon, a label ("Email") and the value ("hello@…"), which is a link
 * when there is an `href` (mailto:, tel:, a URL). `copy` adds a copy button for the value. `row`
 * lists methods one under another; `tile` is the canvas's InfoTile, for a grid.
 * @level molecule
 */
@Component({
  selector: 'fm-contact-method',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './contact-method.scss',
  imports: [CopyButton, Icon],
  host: { style: 'display: contents' },
  templateUrl: './contact-method.html',
})
export class ContactMethod {
  readonly icon = input.required<IconDef | string>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly href = input<string>();
  /** Adds a button that copies the value. */
  readonly copy = input(false);
  readonly variant = input<'row' | 'tile'>('row');

  readonly copied = output<string>();

  protected readonly external = computed(() => /^https?:\/\//.test(this.href() ?? ''));
}
