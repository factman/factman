import type { Client, Service } from '@shared';

/** Pure selectors over the content data. No Angular, no I/O: easy to unit test. */

/** Orders records by their `order` field, lowest first; the input is not modified. */
export const byOrder = <T extends { order: number }>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/** Services in display order (catalogue, home grid). */
export const servicesByOrder = (services: readonly Service[]): Service[] => byOrder(services);

/** One service by its URL slug, or `undefined`. */
export const serviceBySlug = (services: readonly Service[], slug: string): Service | undefined =>
  services.find((s) => s.slug === slug);

/** Up to `limit` other services after the current one, wrapping round ("Often booked together"). */
export function relatedServices(services: readonly Service[], slug: string, limit = 4): Service[] {
  const ordered = servicesByOrder(services);
  const at = ordered.findIndex((s) => s.slug === slug);
  if (at < 0) return ordered.slice(0, limit);
  const rest = [...ordered.slice(at + 1), ...ordered.slice(0, at)];
  return rest.slice(0, limit);
}

/** Clients in display order ("Worked with" strip). */
export const clientsByOrder = (clients: readonly Client[]): Client[] => byOrder(clients);
