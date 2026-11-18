import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

import { prefersReducedMotion } from '@shared';

import { COUNT_DURATION, countAt } from './count-up';

/**
 * A big number with its label: "12+ years", "40 projects". It counts up from 0 once, the first time
 * it scrolls into view (docs/interaction-and-motion.md, Count-up). The server HTML and reduced
 * motion show the final value, and screen readers always get the final value: the moving digits
 * are hidden from them. `framed` is the canvas CounterCard (a glass card).
 * @level molecule
 */
@Component({
  selector: 'fm-stat-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './stat-counter.scss',
  host: { style: 'display: contents' },
  templateUrl: './stat-counter.html',
})
export class StatCounter {
  readonly value = input.required<number>();
  /** After the number, e.g. "+" or "%". */
  readonly suffix = input('');
  readonly label = input.required<string>();
  readonly framed = input(false);

  /** The number on screen; undefined means the final value. */
  protected readonly shown = signal<number | undefined>(undefined);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = el.ownerDocument.defaultView;
      if (!win || prefersReducedMotion(win) || typeof win.IntersectionObserver !== 'function')
        return;
      const target = el.querySelector('.stat-counter') ?? el;
      let frame = 0;
      const observer = new win.IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = win.performance.now();
        const tick = (now: number) => {
          const n = countAt(this.value(), now - start, COUNT_DURATION);
          this.shown.set(n);
          if (n !== this.value()) frame = win.requestAnimationFrame(tick);
        };
        this.shown.set(0);
        frame = win.requestAnimationFrame(tick);
      });
      observer.observe(target);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        win.cancelAnimationFrame(frame);
      });
    });
  }
}
