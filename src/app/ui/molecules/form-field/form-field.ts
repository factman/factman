import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
} from '@angular/core';

import { FIELD_CONTEXT, type FieldContext } from '@ui/atoms/form-control/field-context';
import { fieldId } from '@ui/atoms/form-control/value-control';
import { Icon } from '@ui/atoms/icon/icon';
import { iconAlert } from '@ui/atoms/icon/icons';

/**
 * A form control with its label, hint and error:
 * `<fm-form-field label="Email" hint="…" [error]="…"><fm-text-input formControlName="email" /></fm-form-field>`.
 * The control inside picks up the label's id, the hint and error (`aria-describedby`), the error
 * state and `required` by itself (FIELD_CONTEXT). The error replaces the hint and is announced
 * politely when it appears.
 * @level molecule
 */
@Component({
  selector: 'fm-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './form-field.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  providers: [{ provide: FIELD_CONTEXT, useExisting: forwardRef(() => FormField) }],
  templateUrl: './form-field.html',
})
export class FormField implements FieldContext {
  readonly label = input.required<string>();
  /** Help under the control, e.g. "I'll only use it to reply". */
  readonly hint = input<string>();
  /** The error message; set it when the value is wrong, leave it empty otherwise. */
  readonly error = input<string>();
  readonly required = input(false);

  readonly controlId = fieldId('fm-field');
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly alert = iconAlert;

  readonly invalid = computed(() => !!this.error());
  /** The error while there is one, otherwise the hint. */
  readonly describedBy = computed(() => {
    if (this.error()) return this.errorId;
    return this.hint() ? this.hintId : undefined;
  });
}
