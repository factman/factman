import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { PRIVATE_PROJECT, PUBLIC_PROJECT } from './project-card.fixtures';
import { ProjectCard } from './project-card';

const providers = [provideRouter([])];

describe('ProjectCard', () => {
  it('links the whole card and shows status, years, stack and public links', async () => {
    await render(ProjectCard, {
      inputs: { project: PUBLIC_PROJECT, href: '/projects/investa' },
      providers,
    });
    const title = screen.getByRole('heading', { level: 3, name: 'Investa.ng' });
    expect(title.querySelector('a')?.getAttribute('href')).toBe('/projects/investa');
    expect(screen.getByText('Fintech · 2021–2022')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Stack' }).querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Live site/ }).getAttribute('href')).toBe(
      'https://investa.ng',
    );
    expect(screen.getByRole('link', { name: /Source/ })).toBeTruthy();
    expect(screen.getByRole('article').classList).toContain('is-featured');
  });

  it('shows the engage action instead of links for a private project (FR-22)', async () => {
    const engage = vi.fn();
    await render(
      `<fm-project-card [project]="project" href="/projects/ledger" (engage)="engage($event)" />`,
      {
        imports: [ProjectCard],
        providers,
        componentProperties: { project: PRIVATE_PROJECT, engage },
      },
    );
    expect(screen.queryByRole('link', { name: /Live site|Source/ })).toBeNull();
    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.getByText('Fintech · 2021–now')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Request a demo' }));
    expect(engage).toHaveBeenCalledWith(PRIVATE_PROJECT);
  });
});
