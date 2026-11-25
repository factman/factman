import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { Project } from '@shared';

import { ProjectCaseStudy } from './project-case-study';

const base = {
  id: 'graphui',
  slug: 'graphui',
  title: 'GraphUI',
  summary: 'Plot graphs on any website.',
  category: 'Open source',
  status: 'maintained',
  featured: true,
  stack: ['typescript'],
  role: 'Creator and maintainer',
  outcome: 'Used on a handful of dashboards.',
  startedAt: '2019',
  gallery: ['projects/graphui-1.webp', 'projects/graphui-2.webp'],
} as const;

const publicProject = {
  ...base,
  visibility: 'public',
  links: { live: 'https://graphui.example.com', source: 'https://github.com/factman/GraphUI' },
} as unknown as Project;

// Even with links in the data, a private project never links out (FR-23).
const privateProject = {
  ...base,
  slug: 'payments-api',
  title: 'Payments API',
  visibility: 'private',
  links: { live: 'https://secret.example.com', source: 'https://github.com/x/secret' },
  engage: { mode: 'request-demo' },
} as unknown as Project;

const renderStudy = (project: Project, extra: Record<string, unknown> = {}) =>
  render(ProjectCaseStudy, {
    inputs: {
      project,
      stack: ['TypeScript'],
      next: { title: 'NeoClock', href: '/projects/neoclock' },
      ...extra,
    },
    providers: [provideRouter([])],
  });

describe('ProjectCaseStudy', () => {
  it('shows the screenshots, role, stack and outcome as named sections', async () => {
    await renderStudy(publicProject);
    expect(screen.getAllByRole('img', { name: /GraphUI, screenshot/ })).toHaveLength(2);
    for (const name of ['My role', 'Stack', 'Outcome', 'Links']) {
      expect(screen.getByRole('region', { name })).toBeTruthy();
    }
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });

  it('links a public project to its live site and source, in a new tab', async () => {
    await renderStudy(publicProject);
    const live = screen.getByRole('link', { name: /Live site/ });
    expect(live.getAttribute('href')).toBe('https://graphui.example.com');
    expect(live.getAttribute('target')).toBe('_blank');
    expect(screen.getByRole('link', { name: /Source code/ })).toBeTruthy();
  });

  it('never links a private project out, and asks for a demo instead', async () => {
    const requestAccess = vi.fn();
    const { container } = await render(ProjectCaseStudy, {
      inputs: { project: privateProject },
      on: { requestAccess },
      providers: [provideRouter([])],
    });
    expect(screen.queryByRole('region', { name: 'Links' })).toBeNull();
    const external = [...container.querySelectorAll('a')].filter((a) =>
      /^https?:/.test(a.getAttribute('href') ?? ''),
    );
    expect(external).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Request a demo' }));
    expect(requestAccess).toHaveBeenCalled();
  });

  it('links back to all projects and on to the next one', async () => {
    await renderStudy(publicProject);
    const nav = screen.getByRole('navigation', { name: 'More projects' });
    expect(nav.querySelector('a[href="/projects"]')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Next project: NeoClock/ }).getAttribute('href')).toBe(
      '/projects/neoclock',
    );
  });
});
