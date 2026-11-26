import { Injectable, signal } from '@angular/core';

import type { ResumeSource } from '../analytics/analytics-events';

/** A request to preview one résumé, and where it came from (for `resume_preview_open`). */
export interface ResumeRequest {
  /** The résumé's slug, or null for the first one (the header's Résumé button). */
  slug: string | null;
  source: ResumeSource;
}

/**
 * Asks for the résumé preview from outside the home page, which owns the preview dialog (FR-43):
 * the header's Résumé button and the footer's résumé links. The home page takes the request when
 * it renders (or at once, if it is already showing) and clears it.
 */
@Injectable({ providedIn: 'root' })
export class ResumeLauncher {
  readonly request = signal<ResumeRequest | null>(null);

  open(slug: string | null, source: ResumeSource): void {
    this.request.set({ slug, source });
  }

  /** The pending request, cleared so it opens once. */
  take(): ResumeRequest | null {
    const request = this.request();
    if (request) this.request.set(null);
    return request;
  }
}
