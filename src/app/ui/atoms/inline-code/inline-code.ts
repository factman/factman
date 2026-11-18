import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * A short piece of code inside a sentence, in the mono font: `pnpm build`.
 * @level atom
 */
@Component({
  selector: 'fm-inline-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './inline-code.scss',
  host: { style: 'display: contents' },
  template: `<code class="fm-icode"><ng-content /></code>`,
})
export class InlineCode {}
