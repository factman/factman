import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

/**
 * A thin line between pieces of content, horizontal or vertical. It is decorative and hidden from
 * assistive tech; a `label` ("or", a date) shows on the line and is read as plain text.
 * @level atom
 */
@Component({
  selector: 'fm-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './divider.scss',
  host: { style: 'display: contents' },
  templateUrl: './divider.html',
})
export class Divider {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Text on a horizontal line. */
  readonly label = input<string>();
  /** Where the label sits on the line. */
  readonly align = input<'center' | 'start'>('center');
  /** The stronger border colour. */
  readonly strong = input(false);

  protected readonly classes = computed(() => {
    const c = [];
    if (this.label() && this.orientation() === 'horizontal') {
      c.push('fm-divider--label');
      if (this.align() === 'start') c.push('fm-divider--start');
    } else {
      c.push(this.orientation() === 'vertical' ? 'fm-divider--v' : 'fm-divider--h');
    }
    if (this.strong()) c.push('fm-divider--strong');
    return c.join(' ');
  });
}
