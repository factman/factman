import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';

import { prefersReducedMotion } from '../motion/reduced-motion';

/**
 * The router's scroller (FR-37): anchors (`/#projects`) scroll smoothly, or jump at once under
 * reduced motion; positions (back and forward, a new page) are left to the router, which asks for an
 * instant scroll. Anchors use `scrollIntoView`, so `scroll-margin-top` keeps the section below the
 * fixed header. Angular's own scroller computes the position itself and ignores that margin.
 * Provided in app.config.ts in place of `ViewportScroller`; does nothing on the server.
 */
@Injectable()
export class AnchorScroller implements ViewportScroller {
  private readonly document = inject(DOCUMENT);
  private readonly window = isPlatformBrowser(inject(PLATFORM_ID))
    ? this.document.defaultView
    : null;

  /**
   * Part of the ViewportScroller contract, unused here: the sections' `scroll-margin-top` clears
   * the header, so there is no offset to apply.
   */
  setOffset(): void {
    // Nothing to store.
  }

  getScrollPosition(): [number, number] {
    return this.window ? [this.window.scrollX, this.window.scrollY] : [0, 0];
  }

  scrollToPosition(position: [number, number], options?: ScrollOptions): void {
    this.window?.scrollTo({ ...options, left: position[0], top: position[1] });
  }

  scrollToAnchor(anchor: string, options?: ScrollOptions): void {
    if (!this.window) return;
    const target =
      this.document.getElementById(anchor) ?? this.document.getElementsByName(anchor)[0];
    if (!target) return;
    const behavior =
      options?.behavior ?? (prefersReducedMotion(this.window) ? 'instant' : 'smooth');
    target.scrollIntoView({ block: 'start', behavior });
    target.focus({ preventScroll: true });
  }

  setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void {
    try {
      if (this.window) this.window.history.scrollRestoration = scrollRestoration;
    } catch {
      // Some sandboxed frames refuse it; the browser's own restoration then stays on.
    }
  }
}
