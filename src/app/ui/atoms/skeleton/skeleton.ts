import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

/**
 * A grey placeholder in the shape of content that is still loading. Hidden from assistive tech:
 * whatever is loading announces itself (a Spinner, or `aria-busy` on the region). The pulse stops
 * with reduced motion.
 * @level atom
 */
@Component({
  selector: 'fm-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './skeleton.scss',
  host: { style: 'display: contents' },
  template: `<span
    [class]="classes()"
    [style.width]="width()"
    [style.height]="height()"
    aria-hidden="true"
  ></span>`,
})
export class Skeleton {
  readonly shape = input<'line' | 'circle' | 'rect'>('line');
  /** Any CSS length, e.g. `100%` or `12rem`. Defaults to the design system's size per shape. */
  readonly width = input<string>();
  readonly height = input<string>();

  protected readonly classes = computed(() => {
    const shape = this.shape();
    if (shape === 'circle') return 'fm-skel fm-skel--circle';
    if (shape === 'rect') return 'fm-skel fm-skel--rectangle';
    return 'fm-skel';
  });
}
