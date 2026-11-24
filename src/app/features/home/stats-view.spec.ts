import { careerStrip, statCounters } from './stats-view';

const NOW = new Date('2026-11-10T12:00:00Z');

const org = (organization: string, roles: { start: string; end?: string; title?: string }[]) => ({
  id: organization.toLowerCase(),
  organization,
  roles: roles.map((r, i) => ({
    id: `${organization}-${i}`,
    title: r.title ?? 'Engineer',
    start: r.start,
    end: r.end,
    summary: '',
    highlights: [],
    skills: [],
  })),
});

const experience = [
  org('Simple Finance', [{ start: '2024-01' }, { start: '2021-12', end: '2023-01' }]),
  org('ETeam Technology', [{ start: '2017-05' }]),
  org('Mazadat', [{ start: '2023-04', end: '2024-03' }]),
  org('Old Co', [{ start: '2013-01', end: '2015-06' }]),
  org('Older Co', [{ start: '2015-07', end: '2017-04' }]),
] as never[];

describe('statCounters', () => {
  it('counts years, organizations, roles, projects and technologies from the data', () => {
    const c = statCounters({ experience, projects: [1, 2, 3], skills: [1, 2] }, '2013-01', NOW);
    expect(c.map((s) => [s.label, s.value])).toEqual([
      ['Years of experience', 13],
      ['Organizations', 5],
      ['Roles', 6],
      ['Projects', 3],
      ['Technologies', 2],
    ]);
  });

  it('adds the articles once there are some', () => {
    const c = statCounters({ experience, projects: [], skills: [], articles: 4 }, '2013-01', NOW);
    expect(c.at(-1)).toEqual({ value: 4, label: 'Articles' });
  });
});

describe('careerStrip', () => {
  const { rows, ticks } = careerStrip(experience, '2013-01', NOW);

  it('gives the newest three organizations a row each and folds the rest into "Earlier roles"', () => {
    expect(rows.map((r) => r.org)).toEqual([
      'Simple Finance',
      'ETeam Technology',
      'Mazadat',
      'Earlier roles',
    ]);
    expect(rows[3].bars).toHaveLength(2);
  });

  it('places each role on the axis in percentages, current roles running to now', () => {
    const [current] = rows[0].bars;
    expect(current.left).toBeCloseTo(79.52, 1);
    expect(current.left + current.width).toBeCloseTo(100, 0);
    expect(Math.min(...rows[3].bars.map((b) => b.left))).toBe(0);
    expect(current.label).toContain('Present');
  });

  it('ticks every three years from the start, ending at now', () => {
    expect(ticks).toEqual(['2013', '2016', '2019', '2022', 'now']);
  });
});
