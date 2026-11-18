import { InjectionToken, type Signal } from '@angular/core';

/**
 * What a FormField tells the control inside it (ETE-74): the id its `<label for>` points at, the
 * ids of its hint and error, and whether it is in error or required. The form atoms read it, so
 * `<fm-form-field label="Email"><fm-text-input /></fm-form-field>` is labelled with no wiring.
 * Defined here because atoms can't import molecules.
 */
export interface FieldContext {
  readonly controlId: string;
  readonly describedBy: Signal<string | undefined>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
}

export const FIELD_CONTEXT = new InjectionToken<FieldContext>('FIELD_CONTEXT');
