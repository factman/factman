import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { ValueControl, fieldId } from '../form-control/value-control';

/**
 * An on/off switch with its label beside it, for settings that apply at once (such as a cookie
 * category). It is a checkbox with `role="switch"` and `aria-checked`. Works with Angular forms.
 * @level atom
 */
@Component({
  selector: 'fm-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../checkbox/checkbox.scss', './switch.scss'],
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Switch), multi: true }],
  templateUrl: './switch.html',
})
export class Switch extends ValueControl<boolean> {
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly inputId = input(fieldId('fm-switch'));

  protected emptyValue(): boolean {
    return false;
  }

  protected readonly descId = computed(() => `${this.controlId()}-desc`);
  protected readonly describedBy = computed(
    () =>
      [this.description() ? this.descId() : '', this.describedByIds() ?? '']
        .filter(Boolean)
        .join(' ') || null,
  );
  protected readonly classes = computed(() => {
    const c = ['fm-switch'];
    if (this.size() !== 'md') c.push(`fm-switch--${this.size()}`);
    if (this.value()) c.push('is-on');
    if (this.isInvalid()) c.push('is-error');
    if (this.isDisabled()) c.push('is-disabled');
    return c.join(' ');
  });
}
