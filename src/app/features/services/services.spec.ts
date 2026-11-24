import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { ServicesPage } from './services';

describe('ServicesPage (/services)', () => {
  it('has the hero, every service, the process, the call to action and the FAQ', async () => {
    const { container } = await render(ServicesPage, { providers: [provideRouter([])] });
    const { services } = await import('@data/services');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Senior help for the work that matters most' }),
    ).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(container.querySelectorAll('#catalogue .service-card')).toHaveLength(services.length);
    expect(container.querySelector('section#process .fm-stepper')).toBeTruthy();
    expect(screen.getByText('Not sure which service fits?')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Questions clients ask first' })).toBeTruthy();
  });

  it('counts the services in the lead and links "Browse services" to the catalogue', async () => {
    await render(ServicesPage, { providers: [provideRouter([])] });
    expect(screen.getByText(/^Eight ways to work together/)).toBeTruthy();
    // `#catalogue` stays on the current page (Button's parseHref).
    expect(screen.getByRole('link', { name: /Browse services/ }).getAttribute('href')).toMatch(
      /#catalogue$/,
    );
  });

  it('opens the booking calendar from "Schedule a call", in a new tab', async () => {
    await render(ServicesPage, { providers: [provideRouter([])] });
    const [schedule] = screen.getAllByRole('link', { name: /Schedule a call/ });
    expect(schedule.getAttribute('href')).toMatch(/^https:\/\//);
    expect(schedule.getAttribute('target')).toBe('_blank');
  });
});
