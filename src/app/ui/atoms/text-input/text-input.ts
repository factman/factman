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
import type { IconDef } from '../icon/icon-def';
import { ValueControl, fieldId } from '../form-control/value-control';

export type FieldSize = 'sm' | 'md' | 'lg' | 'xl';
export type TextInputType = 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';

/** The size classes shared by the text controls. */
export const fieldClasses = (size: FieldSize, invalid: boolean, disabled: boolean): string => {
  const c = ['fm-field', 'fm-field--fluid'];
  if (size !== 'md') c.push(`fm-field--${size}`);
  if (invalid) c.push('is-error');
  if (disabled) c.push('is-disabled');
  return c.join(' ');
};

/**
 * A single-line text box. Works with Angular forms (`formControlName`, `ngModel`). It has no
 * visible label of its own: wrap it in a FormField, which links the label by `inputId` and the
 * hint and error by `ariaDescribedby`, or give it an `ariaLabel`.
 * @level atom
 */
@Component({
  selector: 'fm-text-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../form-control/form-control.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextInput), multi: true },
  ],
  templateUrl: './text-input.html',
})
export class TextInput extends ValueControl<string> {
  readonly type = input<TextInputType>('text');
  readonly placeholder = input<string>();
  readonly autocomplete = input<string>();
  readonly maxLength = input<number>();
  readonly size = input<FieldSize>('md');
  readonly leadingIcon = input<IconDef | string>();
  /** The input's id, for a `<label for>`. */
  readonly inputId = input(fieldId('fm-text-input'));
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string>();

  protected emptyValue(): string {
    return '';
  }

  protected readonly classes = computed(() =>
    fieldClasses(this.size(), this.isInvalid(), this.isDisabled()),
  );
}
