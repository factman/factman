import { careerGlance, darkLogos, timelineEntries } from './experience-view';

const NOW = new Date('2026-11-10T12:00:00Z');

const experience = [
  {
    id: 'mazadat',
    organization: 'Mazadat',
    logo: 'clients/mazadat.svg',
    roles: [
      {
        id: 'mz-senior',
        title: 'Senior Frontend Engineer',
        start: '2023-04',
        end: '2023-10',
        summary: 'Mission team.',
        highlights: ['A/B experiments'],
        skills: ['react'],
      },
      {
        id: 'mz-lead',
        title: 'Frontend Lead Engineer',
        start: '2023-10',
        end: '2024-03',
        summary: 'Frontend lead.',
        highlights: ['Drove frontend strategy', { text: 'Résumé only', tracks: ['fullstack'] }],
        skills: ['react', 'unknown-skill'],
      },
    ],
  },
  {
    id: 'simple-finance',
    organization: 'Simple Finance',
    website: 'https://simplefinance.ng',
    logo: 'clients/simple-finance.png',
    roles: [
      {
        id: 'sf-cto',
        title: 'Chief Technology Officer',
        type: 'full-time',
        start: '2024-01',
        summary: 'Lead the technology team.',
        highlights: [],
        skills: ['angular'],
      },
    ],
  },
] as const;

const skills = [
  { id: 'react', name: 'React' },
  { id: 'angular', name: 'Angular' },
];

describe('timelineEntries', () => {
  const entries = timelineEntries(
    experience as never,
    skills,
    NOW,
    new Set(['clients/mazadat.svg']),
  );

  it('orders organizations and roles by recency (sortExperience)', () => {
    expect(entries.map((e) => e.id)).toEqual(['simple-finance', 'mazadat']);
    expect(entries[1].roles.map((r) => r.id)).toEqual(['mz-lead', 'mz-senior']);
  });

  it('formats periods and durations, with "Present" for a current role', () => {
    const cto = entries[0].roles[0];
    expect(cto.period).toBe('Jan 2024 – Present');
    expect(cto.duration).toBe('2 yrs 11 mos');
    expect(cto.current).toBe(true);
    expect(cto.type).toBe('Full-time');
    expect(entries[1].roles[0].current).toBe(false);
  });

  it("totals an organization's span when it has several roles", () => {
    expect(entries[1].total).toBe('1 yr · 2 roles');
    expect(entries[0].total).toBeUndefined();
  });

  it('keeps only the untagged highlights and names the skills', () => {
    expect(entries[1].roles[0].highlights).toEqual(['Drove frontend strategy']);
    expect(entries[1].roles[0].skills).toEqual(['React', 'unknown-skill']);
  });

  it('serves the logo from assets, on the plate clients.json gives it', () => {
    expect(entries[1].logo).toBe('/assets/clients/mazadat.svg');
    expect(entries[1].logoDark).toBe(true);
    expect(entries[0].logoDark).toBe(false);
  });
});

describe('careerGlance', () => {
  it('lists the current roles and counts from the data', () => {
    const glance = careerGlance(experience as never, '2013-01', NOW);
    expect(glance.roles).toEqual([
      { title: 'Chief Technology Officer', description: 'Simple Finance · since Jan 2024' },
    ]);
    expect(glance.stats.map((s) => [s.value, s.label])).toEqual([
      [13, 'years since 2013'],
      [2, 'organizations'],
      [3, 'roles'],
      [1, 'current roles'],
    ]);
  });
});

describe('darkLogos', () => {
  it('collects the logos that need the dark plate', () => {
    const set = darkLogos([
      { logo: 'clients/a.png', plate: 'light' },
      { logo: 'clients/b.svg', plate: 'dark' },
    ]);
    expect([...set]).toEqual(['clients/b.svg']);
  });
});
