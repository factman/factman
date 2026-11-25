import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ServicesPage } from './services';

const renderPage = () => render(ServicesPage, { providers: [provideRouter([])] });

describe('ServicesPage (/services)', () => {
  it('has the hero, every service, the process, the booking channels and the FAQ', async () => {
    const { container } = await renderPage();
    const { services } = await import('@data/services');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Senior help for the work that matters most' }),
    ).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(container.querySelectorAll('#catalogue .service-card')).toHaveLength(services.length);
    expect(container.querySelector('section#process .fm-stepper')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Pick the channel that suits you' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Questions clients ask first' })).toBeTruthy();
  });

  it('counts the services in the lead and links "Browse services" to the catalogue', async () => {
    await renderPage();
    expect(screen.getByText(/^Eight ways to work together/)).toBeTruthy();
    // `#catalogue` stays on the current page (Button's parseHref).
    expect(screen.getByRole('link', { name: /Browse services/ }).getAttribute('href')).toMatch(
      /#catalogue$/,
    );
  });

  it('offers email, WhatsApp and a phone call, each prefilled or dialable', async () => {
    await renderPage();
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => /^(mailto:|tel:|https:\/\/wa\.me)/.test(h));
    expect(hrefs.some((h) => h.startsWith('mailto:') && h.includes('subject='))).toBe(true);
    expect(hrefs.some((h) => h.startsWith('https://wa.me/') && h.includes('text='))).toBe(true);
    expect(hrefs.some((h) => h.startsWith('tel:+'))).toBe(true);
  });

  it('opens the scheduler from the hero\'s "Schedule a call" (FR-19)', async () => {
    const { container } = await renderPage();
    expect(container.querySelector('iframe')).toBeNull();
    await userEvent.click(screen.getAllByRole('button', { name: /Schedule a call/ })[0]);
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('src')).toMatch(
      /^https:\/\/calendar\.google\.com\/calendar\/appointments\//,
    );
  });
});
