import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/**
 * Scroll-spy (FR-37): which page section is in view, for the header to highlight its nav item.
 * Sections register themselves (SectionLayout does); the header reads `active`. A section counts
 * as active while it crosses a line a little below the fixed header. Browser only: on the server
 * nothing is registered and `active` stays undefined.
 */
@Injectable({ providedIn: 'root' })
export class ScrollSpy {
  private readonly window = inject(DOCUMENT).defaultView;
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
      this.update();
    };
  }

  private ensureObserver(): IntersectionObserver | undefined {
    if (this.observer) return this.observer;
    if (typeof this.window?.IntersectionObserver !== 'function') return undefined;
    // A band from just under the header to 60% up from the bottom: the section crossing it is active.
    this.observer = new this.window.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-spy');
          if (id) this.visible.set(id, entry.isIntersecting);
        }
        this.update();
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    return this.observer;
  }

  /** The first section in page order that is in the band. */
  private update(): void {
    this.active.set(this.order.find((id) => this.visible.get(id)));
  }
}
