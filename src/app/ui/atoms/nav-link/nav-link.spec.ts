import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { NavLink } from './nav-link';

const router = [provideRouter([])];

describe('NavLink', () => {
  it('routes app paths, with a fragment, and is not current by default', async () => {
    await render(`<fm-nav-link href="/#about" label="About" />`, {
      imports: [NavLink],
      providers: router,
    });
    const link = screen.getByRole('link', { name: 'About' });
    expect(link.getAttribute('href')).toBe('/#about');
    expect(link.className).toBe('fm-navlink fm-navlink--pill');
    expect(link.getAttribute('aria-current')).toBeNull();
  });

  it('marks the current page, small and underlined when asked', async () => {
    await render(
      `<fm-nav-link href="/services" label="Services" [active]="true" size="sm" variant="underline" />`,
      { imports: [NavLink], providers: router },
    );
    const link = screen.getByRole('link', { name: 'Services' });
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.classList).toContain('is-active');
    expect(link.classList).toContain('fm-navlink--sm');
    expect(link.classList).toContain('fm-navlink--underline');
  });

  it('marks the section in view as the current location', async () => {
    await render(`<fm-nav-link href="/#contact" label="Contact" active="location" />`, {
      imports: [NavLink],
      providers: router,
    });
    expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('aria-current')).toBe(
      'location',
    );
  });

  it('renders other URLs as a plain href', async () => {
    await render(`<fm-nav-link href="https://medium.com/@factman60" label="Medium" />`, {
      imports: [NavLink],
      providers: router,
    });
    expect(screen.getByRole('link', { name: 'Medium' }).getAttribute('href')).toBe(
      'https://medium.com/@factman60',
    );
  });
});
