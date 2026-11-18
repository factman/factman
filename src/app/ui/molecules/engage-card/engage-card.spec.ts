import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconActivity } from '@ui/atoms';

import { EngageCard } from './engage-card';

describe('EngageCard', () => {
  it('shows the note and facts, links a similar project and asks about this one', async () => {
    const request = vi.fn();
    await render(
      `<fm-engage-card [project]="project" [facts]="facts" (requestAccess)="request()" />`,
      {
        imports: [EngageCard],
        providers: [provideRouter([])],
        componentProperties: {
          request,
          project: {
            title: 'Ledger',
            visibility: 'private',
            engage: { mode: 'request-demo', note: 'Under NDA; a demo is available.' },
          },
          facts: [{ title: 'Status', value: 'In progress', icon: iconActivity }],
        },
      },
    );
    expect(screen.getByRole('heading', { name: 'How to engage' })).toBeTruthy();
    expect(screen.getByText('Under NDA; a demo is available.')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Start a similar project/ }).getAttribute('href')).toBe(
      '/services',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Request a demo' }));
    expect(request).toHaveBeenCalledOnce();
  });

  it('falls back to a public note and "Ask about this project"', async () => {
    await render(EngageCard, {
      inputs: { project: { title: 'Investa', visibility: 'public' } },
      providers: [provideRouter([])],
    });
    expect(screen.getByText(/Public project/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ask about this project' })).toBeTruthy();
  });
});
