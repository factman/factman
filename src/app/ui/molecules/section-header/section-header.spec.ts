import { render, screen } from '@testing-library/angular';

import { SectionHeader } from './section-header';

describe('SectionHeader', () => {
  it('shows the eyebrow, an h2 title and the intro', async () => {
    await render(SectionHeader, {
      inputs: {
        index: '02',
        eyebrow: 'Services',
        title: 'What I build',
        description: 'Web, mobile and payments.',
        headingId: 'services-title',
      },
    });
    const heading = screen.getByRole('heading', { level: 2, name: 'What I build' });
    expect(heading.id).toBe('services-title');
    expect(screen.getByText(/Services/).textContent).toContain('02 ·');
    expect(screen.getByText('Web, mobile and payments.')).toBeTruthy();
  });

  it('takes a heading level and projected action', async () => {
    await render(
      `<fm-section-header title="Projects" [level]="1" align="center"><a href="/projects">All projects</a></fm-section-header>`,
      {
        imports: [SectionHeader],
      },
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'All projects' })).toBeTruthy();
    expect(screen.getByRole('banner').classList).toContain('is-center');
  });
});
