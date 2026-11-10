import { clients } from './clients';
import type { Project, Skill } from '@shared';

import { projects } from './projects';
import {
  byOrder,
  clientsByOrder,
  featuredProjects,
  MAX_FEATURED_PROJECTS,
  newestPosts,
  projectBySlug,
  projectsByRecency,
  relatedServices,
  serviceBySlug,
  servicesByOrder,
  SKILL_CATEGORIES,
  skillsByCategory,
} from './selectors';
import { services } from './services';
import { skills } from './skills';

describe('data selectors', () => {
  it('orders by the order field without mutating the input', () => {
    const input = [{ order: 3 }, { order: 1 }, { order: 2 }];
    expect(byOrder(input).map((i) => i.order)).toEqual([1, 2, 3]);
    expect(input.map((i) => i.order)).toEqual([3, 1, 2]);
  });

  it('lists the 8 services in display order', () => {
    const ordered = servicesByOrder(services);
    expect(ordered).toHaveLength(8);
    expect(ordered[0].slug).toBe('consultancy');
    expect(ordered.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('finds a service by slug, or nothing', () => {
    expect(serviceBySlug(services, 'devops')?.title).toBe('DevOps');
    expect(serviceBySlug(services, 'nope')).toBeUndefined();
  });

  it('suggests the next services after the current one, wrapping round', () => {
    const last = servicesByOrder(services).at(-1)!.slug;
    const related = relatedServices(services, last).map((s) => s.order);
    expect(related).toEqual([1, 2, 3, 4]);
    expect(relatedServices(services, 'consultancy').map((s) => s.slug)).not.toContain(
      'consultancy',
    );
  });

  it('lists clients in display order', () => {
    expect(clientsByOrder(clients)[0].name).toBe('Simple Finance');
  });

  describe('projects', () => {
    const p = (slug: string, startedAt: string, featured = true) =>
      ({ slug, startedAt, featured }) as Project;

    it('orders projects newest first, year-only dates included, without mutating the input', () => {
      const input = [p('a', '2019-03'), p('b', '2022-06'), p('c', '2020'), p('d', '2020-02')];
      expect(projectsByRecency(input).map((x) => x.slug)).toEqual(['b', 'd', 'c', 'a']);
      expect(input.map((x) => x.slug)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('shows at most 6 featured projects, newest first, skipping the rest', () => {
      const many = Array.from({ length: 8 }, (_, i) => p(`p${i}`, `201${i}`));
      many.push(p('hidden', '2030', false));
      const grid = featuredProjects(many);
      expect(grid).toHaveLength(MAX_FEATURED_PROJECTS);
      expect(grid[0].slug).toBe('p7');
      expect(grid.map((x) => x.slug)).not.toContain('hidden');
    });

    it('serves the seeded projects: 5 featured, newest first, found by slug', () => {
      expect(featuredProjects(projects).map((x) => x.slug)).toEqual([
        'neoclock',
        'ubuntu-server-setup',
        'covid-daily-update',
        'covid19-api',
        'graphui',
      ]);
      expect(projectBySlug(projects, 'graphui')?.title).toBe('GraphUI');
      expect(projectBySlug(projects, 'nope')).toBeUndefined();
    });
  });

  describe('skills', () => {
    const s = (name: string, category: Skill['category'], since?: number, featured = false) =>
      ({ name, category, since, featured }) as Skill;

    it('groups by area in display order: featured, then longest used, then by name', () => {
      const groups = skillsByCategory([
        s('Zed', 'Tools'),
        s('Git', 'Tools', 2016, true),
        s('Linux', 'Tools'),
        s('VS Code', 'Tools', 2017),
        s('Angular', 'Frontend', 2017),
        s('HTML5', 'Frontend', 2014),
      ]);
      expect(groups.map((g) => g.category)).toEqual(['Frontend', 'Tools']);
      expect(groups[0].skills.map((x) => x.name)).toEqual(['HTML5', 'Angular']);
      expect(groups[1].skills.map((x) => x.name)).toEqual(['Git', 'VS Code', 'Linux', 'Zed']);
    });

    it('puts every seeded skill in exactly one of the 7 areas', () => {
      const groups = skillsByCategory(skills);
      expect(groups.map((g) => g.category)).toEqual([...SKILL_CATEGORIES]);
      expect(groups.reduce((n, g) => n + g.skills.length, 0)).toBe(skills.length);
      expect(groups[0].skills.slice(0, 2).map((x) => x.name)).toEqual(['JavaScript', 'TypeScript']);
    });
  });

  it('picks the newest 3 posts by publish date', () => {
    const posts = [
      { id: 'a', publishedAt: '2024-01-05' },
      { id: 'b', publishedAt: '2026-03-01T10:00:00Z' },
      { id: 'c', publishedAt: '2025-07-20' },
      { id: 'd', publishedAt: '2023-12-31' },
    ];
    expect(newestPosts(posts).map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(newestPosts([])).toEqual([]);
    expect(posts[0].id).toBe('a');
  });
});
