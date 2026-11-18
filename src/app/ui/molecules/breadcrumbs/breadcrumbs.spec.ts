import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  it('links the trail and marks the current page', async () => {
    await render(Breadcrumbs, {
      inputs: {
        crumbs: [
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: 'Investa' },
        ],
      },
      providers: [provideRouter([])],
    });
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Projects' }).getAttribute('href')).toBe('/projects');
    const current = screen.getByText('Investa');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('link', { name: 'Investa' })).toBeNull();
  });
});
