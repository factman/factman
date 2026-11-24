import { ProjectsRepository } from '@core/data';
import { projects } from '@data/projects';
import type { Project } from '@shared';

import { openApp, text } from './it-harness';

// IT-04 (US-11, US-12): a public project links out; a private one has no outbound link and offers
// "Request access". The seed data is all public, so the private case marks one of them private.
describe('IT-04 ProjectDetailPage differs for a public and a private project', () => {
  const external = (page: HTMLElement) =>
    [...page.querySelectorAll('main a, fm-project-case-study a')].filter((a) =>
      /^https?:/.test(a.getAttribute('href') ?? ''),
    );

  it('shows a public project with its live or source links and the engage CTA', async () => {
    const project = projects.find(
      (p) => p.visibility === 'public' && (p.links.live || p.links.source),
    )!;
    const { page } = await openApp(`/projects/${project.slug}`);
    expect(text(page.querySelector('h1'))).toBe(project.title);
    const hrefs = external(page).map((a) => a.getAttribute('href'));
    for (const href of [project.links.live, project.links.source].filter(Boolean)) {
      expect(hrefs).toContain(href);
    }
  });

  it('shows a private project with a "Private" tag, no outbound link and "Request access"', async () => {
    const secret = {
      ...projects[0],
      visibility: 'private',
      engage: { mode: 'request-access' },
    } as unknown as Project;
    const list = [secret, ...projects.slice(1)];
    const repo = {
      all: () => list,
      featured: () => list.filter((p) => p.featured),
      bySlug: (slug: string) => list.find((p) => p.slug === slug),
      slugs: () => list.map((p) => p.slug),
    };
    const { page } = await openApp(`/projects/${secret.slug}`, [
      { provide: ProjectsRepository, useValue: repo },
    ]);
    expect(page.textContent).toContain('Private');
    for (const href of [projects[0].links.live, projects[0].links.source].filter(Boolean)) {
      expect(external(page).map((a) => a.getAttribute('href'))).not.toContain(href);
    }
    expect([...page.querySelectorAll('button')].some((b) => text(b) === 'Request access')).toBe(
      true,
    );
  });
});
