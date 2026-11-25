import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import type { Project } from '@shared';

import { engageMailto, ProjectDetailPage } from './project-detail';
import userEvent from '@testing-library/user-event';
import { ANALYTICS_TRACKER } from '@shared';

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

describe('ProjectDetailPage analytics (FR-35)', () => {
  it('sends project_open, and project_link_click for a public link', async () => {
    const { projects } = await import('@data/projects');
    const graphui = projects.find((p) => p.slug === 'graphui')!;
    const track = vi.fn();
    await render(ProjectDetailPage, {
      inputs: { project: graphui },
      providers: [provideRouter([]), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    expect(track).toHaveBeenCalledWith('project_open', {
      project_id: graphui.id,
      status: graphui.status,
      visibility: 'public',
    });
    const link = screen.getAllByRole('link').find((a) => a.textContent?.includes('Source code'))!;
    expect(link).toBeTruthy();
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    expect(track).toHaveBeenCalledWith('project_link_click', {
      project_id: graphui.id,
      link_type: 'source',
    });
  });

  it('sends project_access_request for a private project', async () => {
    const { projects } = await import('@data/projects');
    const graphui = projects.find((p) => p.slug === 'graphui')!;
    const hidden: Project = {
      ...graphui,
      visibility: 'private',
      engage: { mode: 'request-access', note: 'Access is by request.' },
    };
    const track = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    await render(ProjectDetailPage, {
      inputs: { project: hidden },
      providers: [provideRouter([]), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    const button = screen
      .getAllByRole('button')
      .find((b) => /Request access/i.test(b.textContent ?? ''))!;
    await userEvent.click(button);
    expect(track).toHaveBeenCalledWith('project_access_request', {
      project_id: hidden.id,
      mode: 'request-access',
    });
    vi.unstubAllGlobals();
  });
});
