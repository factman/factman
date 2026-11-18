import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { CopyButton } from '../copy-button/copy-button';
import { WindowFrame } from '../window-frame/window-frame';
import { type CodeLanguage, highlight } from './highlight';

/**
 * A code sample in an editor window: the file name in the bar, line numbers, the design system's
 * syntax colours and a copy button. The code area scrolls sideways and can take keyboard focus;
 * line numbers are hidden from screen readers and from text selection.
 * @level molecule
 */
@Component({
  selector: 'fm-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './code-block.scss',
  imports: [CopyButton, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './code-block.html',
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly language = input<CodeLanguage>('ts');
  readonly filename = input<string>();
  /** Shows line numbers. */
  readonly lineNumbers = input(true);

  readonly copied = output<string>();

  protected readonly lines = computed(() => highlight(this.code(), this.language()));
  protected readonly regionLabel = computed(() => this.filename() ?? `${this.language()} code`);
}
