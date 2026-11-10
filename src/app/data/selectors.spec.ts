import { clients } from './clients';
import {
  byOrder,
  clientsByOrder,
  relatedServices,
  serviceBySlug,
  servicesByOrder,
} from './selectors';
import { services } from './services';

describe('data selectors', () => {
  it('orders by the order field without mutating the input', () => {
    const input = [{ order: 3 }, { order: 1 }, { order: 2 }];
    expect(byOrder(input).map((i) => i.order)).toEqual([1, 2, 3]);
    expect(input.map((i) => i.order)).toEqual([3, 1, 2]);
  });

  it('lists the 8 services in display order', () => {
    const ordered = servicesByOrder(services);
    expect(ordered).toHaveLength(8);
    expect(ordered[0].slug).toBe('consultancy');
    expect(ordered.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('finds a service by slug, or nothing', () => {
    expect(serviceBySlug(services, 'devops')?.title).toBe('DevOps');
    expect(serviceBySlug(services, 'nope')).toBeUndefined();
  });

  it('suggests the next services after the current one, wrapping round', () => {
    const last = servicesByOrder(services).at(-1)!.slug;
    const related = relatedServices(services, last).map((s) => s.order);
    expect(related).toEqual([1, 2, 3, 4]);
    expect(relatedServices(services, 'consultancy').map((s) => s.slug)).not.toContain(
      'consultancy',
    );
  });

  it('lists clients in display order', () => {
    expect(clientsByOrder(clients)[0].name).toBe('Simple Finance');
  });
});
