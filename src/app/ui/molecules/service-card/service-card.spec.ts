import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { provideIcons } from '@ui/atoms/icon/icon-registry';
import { iconLightbulb } from '@ui/atoms/icon/icons';

import { ServiceCard } from './service-card';

const service = {
  slug: 'consultancy',
  title: 'Consultancy',
  summary: 'Independent advice before you commit budget.',
  icon: 'lightbulb',
  deliverables: ['Discovery', 'Architecture review', 'Roadmap', 'Read-out session'] as [
    string,
    ...string[],
  ],
};
const providers = [provideRouter([]), provideIcons([iconLightbulb])];

describe('ServiceCard', () => {
  it('ends with a quote link for the service', async () => {
    const { container } = await render(ServiceCard, { inputs: { service }, providers });
    expect(screen.getByRole('heading', { level: 3, name: 'Consultancy' })).toBeTruthy();
    const quote = screen.getByRole('link', { name: /Get a quote/ });
    expect(quote.getAttribute('href')).toBe('/contact?service=consultancy');
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('is a linked tile with deliverables when it has an href', async () => {
    await render(ServiceCard, {
      inputs: { service, href: '/services/consultancy', current: true },
      providers,
    });
    const link = screen.getByRole('link', { name: 'Consultancy' });
    expect(link.getAttribute('href')).toBe('/services/consultancy');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Discovery',
      'Architecture review',
      'Roadmap',
    ]);
    expect(screen.queryByRole('link', { name: /Get a quote/ })).toBeNull();
    expect(screen.getByRole('article').classList).toContain('is-current');
  });
});
