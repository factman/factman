import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import { fieldId } from '@ui/atoms/form-control/value-control';
import { Icon } from '@ui/atoms/icon/icon';
import { type IconDef } from '@ui/atoms/icon/icon-def';

/**
 * A card the visitor picks, such as the kind of call to book. It is a real radio button (or
 * checkbox) with the card as its label, so arrow keys move between cards that share a `name`.
 * The parent owns `selected`; `selectedChange` reports a pick.
 * @level molecule
 */
@Component({
  selector: 'fm-selectable-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './selectable-card.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  templateUrl: './selectable-card.html',
})
export class SelectableCard {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly icon = input<IconDef | string>();
  readonly selected = input(false);
  readonly disabled = input(false);
  /** `radio` for one choice in a group (give the cards one `name`), `checkbox` for several. */
  readonly type = input<'radio' | 'checkbox'>('radio');
  readonly name = input<string>();
  readonly value = input<string>();

  readonly selectedChange = output<boolean>();

  protected readonly id = fieldId('fm-selcard');
}
