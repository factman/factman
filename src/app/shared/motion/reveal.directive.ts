import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

import { prefersReducedMotion } from './reduced-motion';

/**
 * Reveal on scroll (ETE-26): fades and lifts an element in the first time it scrolls into view,
 * using the design system's `.fm-reveal` / `.is-in` classes (global.css).
 *
 * The prerendered HTML is never hidden: the element only becomes `.fm-reveal` in the browser, and
 * only if it starts below the fold. With reduced motion, or without IntersectionObserver, nothing
 * is hidden at all. Only opacity and transform animate.
 *
 * ```html
 * <section fmReveal [fmRevealDelay]="120">…</section>
 * ```
 */
@Directive({
  selector: '[fmReveal]',
  host: { '[style.transition-delay.ms]': 'delay() || null' },
})
export class Reveal {
  /** Stagger in ms, for items revealed together (0, 60, 120 …). */
  readonly delay = input(0, { alias: 'fmRevealDelay' });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = el.ownerDocument.defaultView;
      if (!win || prefersReducedMotion(win) || typeof win.IntersectionObserver !== 'function')
        return;
      const { top, bottom } = el.getBoundingClientRect();
      if (top < win.innerHeight && bottom > 0) return; // on screen at load: never hide it
      el.classList.add('fm-reveal');
      // No negative root margin: an element at the very foot of the page can never scroll above
      // one, and would stay hidden.
      const observer = new win.IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.classList.add('is-in');
        observer.disconnect();
      });
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
