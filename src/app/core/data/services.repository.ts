import { Injectable } from '@angular/core';
import { relatedServices, serviceBySlug, servicesByOrder } from '@data';
import { services } from '@data/services';
import type { Service } from '@shared';

/**
 * Services data for pages and resolvers. `providedIn: 'root'` and never registered eagerly, so
 * services.json ships only in the lazy chunks that inject this repository (ADR-002).
 */
@Injectable({ providedIn: 'root' })
export class ServicesRepository {
  private readonly ordered = servicesByOrder(services);

  /** All services in display order. */
  all(): readonly Service[] {
    return this.ordered;
  }

  bySlug(slug: string): Service | undefined {
    return serviceBySlug(this.ordered, slug);
  }

  /** Every service slug: the prerender list for /services/:slug. */
  slugs(): string[] {
    return this.ordered.map((s) => s.slug);
  }

  related(slug: string, limit = 4): Service[] {
    return relatedServices(this.ordered, slug, limit);
  }
}
