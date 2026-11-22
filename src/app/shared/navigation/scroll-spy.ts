import { Location } from '@angular/common';
import { DOCUMENT, Injectable, InjectionToken, inject, signal } from '@angular/core';

/**
 * Whether scroll-spy runs (site.json `features.scrollSpy`, a P1 flag; CoreModule provides it).
 * Off, sections are not observed, no nav item is marked as in view and the URL hash stays as the
 * visitor left it. Defaults to on, for stories and tests.
 */
export const SCROLL_SPY_ENABLED = new InjectionToken<boolean>('fm.scrollSpy', {
  providedIn: 'root',
  factory: () => true,
});

/**
 * Scroll-spy (FR-37): which page section is in view, for the header to highlight its nav item.
 * Sections register themselves (SectionLayout does); the header reads `active`. A section counts
 * as active while it crosses a line a little below the fixed header.
 *
 * As the section in view changes, the URL hash follows it (`/#projects`) with `replaceState`: no
 * jump, no new history entry, and the router's history state is kept. Scrolling back above the
 * first section drops the hash. Only scrolling changes it: sections leaving the page (a navigation)
 * never touch the URL.
 *
 * Browser only: on the server nothing is registered and `active` stays undefined.
 */
@Injectable({ providedIn: 'root' })
export class ScrollSpy {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly location = inject(Location);
  private readonly enabled = inject(SCROLL_SPY_ENABLED);
  private readonly visible = new Map<string, boolean>();
  private readonly order: string[] = [];
  private observer?: IntersectionObserver;

  /** The id of the section in view, or undefined (top of the page, or between sections). */
  readonly active = signal<string | undefined>(undefined);

  /** Starts watching a section. Returns the function that stops it. */
  register(id: string, element: Element): () => void {
    const observer = this.ensureObserver();
    if (!observer) return () => undefined;
    element.setAttribute('data-spy', id);
    this.order.push(id);
    this.visible.set(id, false);
    observer.observe(element);
    return () => {
      observer.unobserve(element);
      this.visible.delete(id);
      this.order.splice(this.order.indexOf(id), 1);
      this.update(false);
    };
  }

  private ensureObserver(): IntersectionObserver | undefined {
    if (!this.enabled) return undefined;
    if (this.observer) return this.observer;
    if (typeof this.window?.IntersectionObserver !== 'function') return undefined;
    // A band from just under the header to 60% up from the bottom: the section crossing it is active.
    this.observer = new this.window.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-spy');
          if (id) this.visible.set(id, entry.isIntersecting);
        }
        this.update(true);
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    return this.observer;
  }

  /** The first section in page order that is in the band; `scrolled` lets the hash follow it. */
  private update(scrolled: boolean): void {
    const next = this.order.find((id) => this.visible.get(id));
    if (next === this.active()) return;
    this.active.set(next);
    if (scrolled) this.syncHash(next);
  }

  /** Puts the section in the URL hash without scrolling or adding a history entry. */
  private syncHash(id: string | undefined): void {
    const path = this.location.path(false);
    this.location.replaceState(id ? `${path}#${id}` : path, '', this.location.getState());
  }
}
