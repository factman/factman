import { careerStrip, contributionGraph, statCounters } from './stats-view';

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

describe('contributionGraph (FR-33)', () => {
  const snapshot = {
    login: 'factman',
    url: 'https://github.com/factman',
    fetchedAt: '2026-11-24T06:00:00Z',
    start: '2025-11-23',
    total: 1284,
    // Nine weeks from Sunday 23 Nov 2025: into December and January.
    weeks: [
      [0, 2, 3, 0, 1, 1, 1],
      [9, 0, 3, 0, 0, 0, 0],
      ...Array.from({ length: 7 }, () => [1, 0, 0, 0, 0, 0, 0]),
    ],
  };

  it('hides without a snapshot', () => {
    expect(contributionGraph(null)).toBeUndefined();
    expect(contributionGraph({ ...snapshot, weeks: [] })).toBeUndefined();
  });

  it('labels each month at its first week', () => {
    expect(contributionGraph(snapshot)!.months).toEqual([
      { label: 'Nov', week: 0 },
      { label: 'Dec', week: 2 },
      { label: 'Jan', week: 6 },
    ]);
  });

  it('drops a first label squeezed into a single week', () => {
    const late = { ...snapshot, start: '2025-11-30' };
    expect(contributionGraph(late)!.months.map((m) => m.label)).toEqual(['Dec', 'Jan']);
  });

  it('states the figures as its text alternative, and links to the profile', () => {
    const graph = contributionGraph(snapshot)!;
    expect(graph.summary).toBe(
      '1,284 contributions in the last year, on 14 days. Busiest day: 9 on 30 Nov 2025. Longest streak: 4 days.',
    );
    expect(graph.profileUrl).toBe('https://github.com/factman');
    expect(graph.levels[1][0]).toBe(4);
  });

  it('says so when the year was quiet', () => {
    expect(contributionGraph({ ...snapshot, total: 0, weeks: [[0, 0]] })!.summary).toBe(
      'No contributions in the last year.',
    );
  });
});
