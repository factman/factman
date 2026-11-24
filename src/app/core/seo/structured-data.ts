import { DOCUMENT, Injectable, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

/** The one structured-data block a page has, in the <head>. */
export const STRUCTURED_DATA_ID = 'structured-data';

/** Schema.org JSON-LD: a single node or a `@graph`. */
export type JsonLd = Record<string, unknown>;

/**
 * Writes a page's schema.org data (JSON-LD) into the <head> so it is in the prerendered HTML
 * (ETE-113). A page sets it when it is created; it is removed when the next navigation starts, so
 * a page without data never keeps the previous page's. The block is data, not a script the
 * browser runs, so the CSP does not need its hash.
 */
@Injectable({ providedIn: 'root' })
export class StructuredData {
  private readonly document = inject(DOCUMENT);

  constructor() {
    inject(Router, { optional: true })?.events.subscribe((e) => {
      if (e instanceof NavigationStart) this.clear();
    });
  }

  set(data: JsonLd): void {
    let script = this.document.getElementById(STRUCTURED_DATA_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.id = STRUCTURED_DATA_ID;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    // `<` is escaped so a value can never close the script element.
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(
      /</g,
      '\\u003c',
    );
  }

  clear(): void {
    this.document.getElementById(STRUCTURED_DATA_ID)?.remove();
  }
}
