import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ANALYTICS_TRACKER } from '@shared';

import { IconRegistry } from '@ui/atoms';
import { SERVICE_ICONS } from '@ui/molecules';

import { type GridService, relatedServices, ServicesGrid } from './services-grid';

/** Any URL renders nothing, so clicking a link in a test navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];

const service = (slug: string, title: string, icon = 'code'): GridService => ({
  slug,
  title,
  summary: `${title} summary.`,
  icon,
  deliverables: ['One', 'Two', 'Three', 'Four'],
});

const services = [
  service('consultancy', 'Consultancy', 'lightbulb'),
  service('engineering', 'Software Engineering'),
  service('fintech', 'Fintech', 'credit-card'),
  service('devops', 'DevOps', 'workflow'),
];

async function renderGrid(inputs: Partial<Record<string, unknown>> = {}) {
  const result = await render(ServicesGrid, {
    inputs: { services, ...inputs },
    providers: [provideRouter([])],
  });
  result.fixture.debugElement.injector.get(IconRegistry).register(SERVICE_ICONS);
  return result;
}

describe('relatedServices', () => {
  it('starts after the current service, wraps round and leaves it out', () => {
    expect(relatedServices(services, 'fintech').map((s) => s.slug)).toEqual([
      'devops',
      'consultancy',
      'engineering',
    ]);
    expect(relatedServices(services, 'unknown')).toHaveLength(4);
  });
});

describe('ServicesGrid', () => {
  it('lists every service as a tile linking to its page, in the order given', async () => {
    await renderGrid();
    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/services/'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/services/consultancy',
      '/services/engineering',
      '/services/fintech',
      '/services/devops',
    ]);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
  });

  it('shows at most `limit` services', async () => {
    await renderGrid({ limit: 2 });
    expect(
      screen
        .getAllByRole('listitem')
        .filter((li) => li.parentElement?.classList.contains('services-grid-list')),
    ).toHaveLength(2);
  });

  it('lists the others after `current` (Often booked together)', async () => {
    await renderGrid({ current: 'engineering' });
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
    expect(titles).toEqual(['Fintech', 'DevOps', 'Consultancy']);
  });

  it('adds the call to action under the grid when it has a label', async () => {
    await renderGrid({ ctaLabel: 'Compare all services' });
    const cta = screen.getByRole('link', { name: /Compare all services/ });
    expect(cta.getAttribute('href')).toBe('/services');
  });

  it('has no call to action without a label', async () => {
    const { container } = await renderGrid();
    expect(container.querySelector('.services-grid-cta')).toBeNull();
    expect(within(container as HTMLElement).queryByText(/Compare/)).toBeNull();
  });
});

describe('ServicesGrid analytics (cta_click)', () => {
  it('sends cta_click from its CTA with location services_section', async () => {
    const track = vi.fn();
    const result = await render(ServicesGrid, {
      inputs: { services, ctaLabel: 'Compare all services' },
      providers: [provideRouter(ANY_ROUTE), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    result.fixture.componentRef.injector.get(IconRegistry).register(SERVICE_ICONS);
    const link = screen.getByRole('link', { name: /Compare all services/ });
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    expect(track).toHaveBeenCalledWith('cta_click', {
      cta_id: 'compare_all_services',
      location: 'services_section',
    });
  });
});
