import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { Link } from './link';

const router = [provideRouter([])];

describe('Link', () => {
  it('routes app paths, with a fragment', async () => {
    await render(`<fm-link href="/services/devops#book">Book DevOps</fm-link>`, {
      imports: [Link],
      providers: router,
    });
    const link = screen.getByRole('link', { name: 'Book DevOps' });
    expect(link.classList).toContain('fm-link');
    expect(link.getAttribute('href')).toBe('/services/devops#book');
    expect(link.getAttribute('target')).toBeNull();
    expect(link.querySelector('svg')).toBeNull();
  });

  it('opens other sites in a new tab with an arrow and a hidden note', async () => {
    await render(`<fm-link href="https://medium.com/@factman60">my articles</fm-link>`, {
      imports: [Link],
      providers: router,
    });
    const link = screen.getByRole('link', { name: 'my articles (opens in a new tab)' });
    expect(link.getAttribute('href')).toBe('https://medium.com/@factman60');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.querySelector('svg')?.getAttribute('data-icon')).toBe('arrow-up-right');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens mail links in place, and honours newTab', async () => {
    await render(
      `<fm-link href="mailto:hi@example.com">Email</fm-link>
       <fm-link href="https://example.com" [newTab]="false">Example</fm-link>`,
      { imports: [Link], providers: router },
    );
    expect(screen.getByRole('link', { name: 'Email' }).getAttribute('target')).toBeNull();
    expect(screen.getByRole('link', { name: 'Example' }).getAttribute('target')).toBeNull();
  });
});
