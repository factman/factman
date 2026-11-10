import { counters, formatPeriod, sortExperience, yearsSince } from '@shared';

import { experience } from './experience';
import { profile } from './profile';
import { projects } from './projects';
import { skills } from './skills';

const NOW = new Date('2026-11-10T12:00:00Z');

describe('seed data with the experience helpers (ETE-42)', () => {
  it('orders the timeline: current roles first, newest start first', () => {
    const sorted = sortExperience(experience);
    expect(sorted.slice(0, 2).map((o) => o.id)).toEqual(['simple-finance', 'eteam-technology']);
    expect(sorted.at(-1)?.id).toBe('jit-solutions');
    expect(sorted[0].roles.map((r) => r.id)).toEqual([
      'simple-finance-cto',
      'simple-finance-cto-2021',
    ]);
    expect(formatPeriod(sorted[0].roles[0])).toBe('Jan 2024 – Present');
  });

  it('computes the stats strip from the data', () => {
    expect(counters({ experience, projects, skills, posts: [] })).toEqual({
      organizations: 10,
      roles: 12,
      projects: 6,
      technologies: 37,
      articles: 0,
    });
  });

  it('computes 13+ years from the career start', () => {
    expect(yearsSince(profile.careerStart, NOW)).toBe(13);
  });

  it('has at most 6 featured projects and shows every skill year as at least 1', () => {
    expect(projects.filter((p) => p.featured).length).toBeLessThanOrEqual(6);
    for (const s of skills) if (s.since) expect(NOW.getUTCFullYear() - s.since).toBeGreaterThan(0);
  });
});
