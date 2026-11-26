import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { iconMail } from '@ui/atoms/icon/icons';

import { List } from './list';

describe('List', () => {
  it('shows rows, with links where there is an href', async () => {
    await render(List, {
      inputs: {
        variant: 'inset',
        items: [
          { title: 'Based in', value: 'Lagos', icon: iconMail },
          { title: 'Résumé', description: 'PDF, 2 pages', href: '/resume' },
        ],
      },
      providers: [provideRouter([])],
    });
    expect(screen.getByRole('list').classList).toContain('fm-list--inset');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Lagos')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Résumé/ });
    expect(link.getAttribute('href')).toBe('/resume');
  });
});
