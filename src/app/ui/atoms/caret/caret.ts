import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * A blinking text cursor, for the typewriter and terminal. Decorative; steady with reduced motion.
 * @level atom
 */
@Component({
  selector: 'fm-caret',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './caret.scss',
  host: { style: 'display: contents' },
  template: `<span class="fm-caret is-{{ shape() }}" aria-hidden="true"></span>`,
})
export class Caret {
  readonly shape = input<'bar' | 'block'>('bar');
}
