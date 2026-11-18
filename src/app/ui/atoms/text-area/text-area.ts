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
import { type FieldSize, fieldClasses } from '../text-input/text-input';

/**
 * A multi-line text box, such as the contact form's message. Works with Angular forms. Like
 * TextInput it gets its label and hint from a FormField, or an `ariaLabel`.
 * @level atom
 */
@Component({
  selector: 'fm-text-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../form-control/form-control.scss', './text-area.scss'],
  host: { style: 'display: contents' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextArea), multi: true }],
  templateUrl: './text-area.html',
})
export class TextArea extends ValueControl<string> {
  readonly rows = input(4);
  readonly placeholder = input<string>();
  readonly maxLength = input<number>();
  readonly size = input<FieldSize>('md');
  readonly inputId = input(fieldId('fm-text-area'));
  readonly ariaLabel = input<string>();

  protected emptyValue(): string {
    return '';
  }

  protected readonly classes = computed(
    () => `${fieldClasses(this.size(), this.isInvalid(), this.isDisabled())} fm-textarea`,
  );
}
