import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { Icon } from '../icon/icon';
import { iconCheck } from '../icon/icons';
import { ValueControl, fieldId } from '../form-control/value-control';

/**
 * A checkbox with its label beside it; clicking the label toggles it. Works with Angular forms
 * (a boolean value).
 * @level atom
 */
@Component({
  selector: 'fm-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './checkbox.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true }],
  templateUrl: './checkbox.html',
})
export class Checkbox extends ValueControl<boolean> {
  readonly label = input.required<string>();
  /** A second line under the label. */
  readonly description = input<string>();
  readonly size = input<16 | 20>(20);
  readonly inputId = input(fieldId('fm-checkbox'));

  protected emptyValue(): boolean {
    return false;
  }

  protected readonly check = iconCheck;
  protected readonly descId = computed(() => `${this.inputId()}-desc`);
  protected readonly describedBy = computed(
    () =>
      [this.description() ? this.descId() : '', this.ariaDescribedby() ?? '']
        .filter(Boolean)
        .join(' ') || null,
  );
  protected readonly classes = computed(() => {
    const c = ['fm-check'];
    if (this.size() === 16) c.push('fm-check--16');
    if (this.invalid()) c.push('is-error');
    if (this.isDisabled()) c.push('is-disabled');
    return c.join(' ');
  });
}
