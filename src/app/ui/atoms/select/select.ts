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
import { iconChevronDown } from '../icon/icons';
import { ValueControl, fieldId } from '../form-control/value-control';
import { type FieldSize, fieldClasses } from '../text-input/text-input';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * A drop-down list of options, styled as a design-system field. It is a native `<select>`, so the
 * keyboard, screen readers and phones all get their own picker. Works with Angular forms.
 * @level atom
 */
@Component({
  selector: 'fm-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../form-control/form-control.scss', './select.scss'],
  imports: [Icon],
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
  templateUrl: './select.html',
})
export class Select extends ValueControl<string> {
  readonly options = input.required<readonly SelectOption[]>();
  /** Shown while nothing is chosen; it can't be chosen again. */
  readonly placeholder = input<string>();
  readonly size = input<FieldSize>('md');
  readonly inputId = input(fieldId('fm-select'));
  readonly ariaLabel = input<string>();

  protected emptyValue(): string {
    return '';
  }

  protected readonly chevron = iconChevronDown;
  protected readonly classes = computed(
    () => `${fieldClasses(this.size(), this.isInvalid(), this.isDisabled())} fm-native-select`,
  );
}
