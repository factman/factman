import { Directive, input, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

let nextId = 0;

/** A unique element id for a control, e.g. `fm-text-input-3`. */
export const fieldId = (prefix: string): string => `${prefix}-${++nextId}`;

/**
 * The shared `ControlValueAccessor` for the form atoms (ETE-71): the value lives in a signal, and
 * the control is disabled by its `disabled` input or by the form. Each atom provides itself as
 * `NG_VALUE_ACCESSOR` and calls `commit()` when the user changes the value.
 */
@Directive()
export abstract class ValueControl<T> implements ControlValueAccessor {
  /** Disables the control. A reactive form's `disable()` does the same. */
  readonly disabled = input(false);
  /** Marks the value as wrong: error styling and `aria-invalid`. */
  readonly invalid = input(false);
  readonly required = input(false);
  readonly name = input<string>();
  /** Ids of the hint and error text (FormField sets these). */
  readonly ariaDescribedby = input<string>();

  /** The value for "nothing": `''` for text, `false` for a checkbox. */
  protected abstract emptyValue(): T;
  /** The current value; starts empty until a form writes one. */
  readonly value = signal<T>(this.emptyValue());
  protected readonly formDisabled = signal(false);

  private onChange: (value: T) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  /** Records a change made by the user and tells the form. */
  protected commit(value: T): void {
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? this.emptyValue());
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
