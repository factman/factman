import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import type { Project } from '@shared';

import { engageMailto, ProjectDetailPage } from './project-detail';

const renderProject = (project: Project) =>
  render(ProjectDetailPage, { inputs: { project }, providers: [provideRouter([])] });

describe('ProjectDetailPage (/projects/:slug)', () => {
  it('shows a public project: title, status, breadcrumbs, stack names and its source', async () => {
    const { projects } = await import('@data/projects');
    const graphui = projects.find((p) => p.slug === 'graphui')!;
    await renderProject(graphui);
    expect(screen.getByRole('heading', { level: 1, name: 'GraphUI' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent).toContain(
      'Projects',
    );
    expect(screen.getAllByText('Maintained').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Source code/ }).getAttribute('href')).toBe(
      graphui.links.source,
    );
  });

  it('shows a private project with no outbound links and a "Private" tag', async () => {
    const { projects } = await import('@data/projects');
    const secret = {
      ...projects[0],
      slug: 'payments-api',
      title: 'Payments API',
      visibility: 'private',
      links: { live: 'https://secret.example.com' },
      engage: { mode: 'request-access' },
    } as unknown as Project;
    const { container } = await renderProject(secret);
    expect(screen.getAllByText('Private').length).toBeGreaterThan(0);
    const external = [...container.querySelectorAll('a')].filter((a) =>
      /^https?:/.test(a.getAttribute('href') ?? ''),
    );
    expect(external).toEqual([]);
    expect(screen.getByRole('button', { name: 'Request access' })).toBeTruthy();
  });
});

describe('engageMailto', () => {
  it('names the project and the kind of request', () => {
    const url = engageMailto(
      { title: 'Payments API', engage: { mode: 'request-demo', note: 'Under NDA.' } },
      'me@x.com',
    );
    expect(url.startsWith('mailto:me@x.com?subject=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('Demo request: Payments API');
    expect(decodeURIComponent(engageMailto({ title: 'GraphUI' }, 'me@x.com'))).toContain(
      'Question: GraphUI',
    );
  });
});
