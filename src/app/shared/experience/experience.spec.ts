import { TestBed } from '@angular/core/testing';

import { CLOCK, systemClock } from '../time/clock';
import { counters } from './counters';
import {
  formatDuration,
  formatPeriod,
  monthsIn,
  PRESENT,
  sortByRecency,
  sortExperience,
} from './experience';
import { formatYearsPlus, skillYears, yearsSince } from './years';

// A fixed clock: every result below is the same on any day and in any time zone.
const NOW = new Date('2026-11-10T12:00:00Z');

describe('sortByRecency (UT-01)', () => {
  it('puts current roles first, then ended roles, each by start date descending', () => {
    const roles = [
      { id: 'old', start: '2014-01', end: '2016-06' },
      { id: 'cur-old', start: '2019-03' },
      { id: 'recent', start: '2020-01', end: '2022-02' },
      { id: 'cur-new', start: '2023-07', end: null },
    ];
    expect(sortByRecency(roles).map((r) => r.id)).toEqual(['cur-new', 'cur-old', 'recent', 'old']);
  });

  it('is stable for equal keys', () => {
    const roles = [
      { id: 'a', start: '2020-01', end: '2021-01' },
      { id: 'b', start: '2020-01', end: '2022-01' },
      { id: 'c', start: '2020-01', end: '2020-06' },
    ];
    expect(sortByRecency(roles).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list for an empty list', () => {
    expect(sortByRecency([])).toEqual([]);
  });

  it('does not modify the input', () => {
    const roles = [
      { start: '2014-01', end: '2015-01' },
      { start: '2020-01', end: '2021-01' },
    ];
    const copy = structuredClone(roles);
    sortByRecency(roles);
    expect(roles).toEqual(copy);
  });

  it('rejects a malformed date, so bad data fails the build', () => {
    expect(() => sortByRecency([{ start: '2020-1' }, { start: '2020-01' }])).toThrow(/YYYY-MM/);
    expect(() => sortByRecency([{ start: '2020-13' }, { start: '2020-01' }])).toThrow(/YYYY-MM/);
  });
});

describe('sortExperience', () => {
  it('sorts roles inside each organization, then organizations by their latest role', () => {
    const orgs = [
      { id: 'ended', roles: [{ id: 'e1', start: '2015-01', end: '2018-01' }] },
      { id: 'empty', roles: [] },
      {
        id: 'current',
        roles: [
          { id: 'c-old', start: '2018-02', end: '2020-01' },
          { id: 'c-now', start: '2020-02' },
        ],
      },
    ];
    const sorted = sortExperience(orgs);
    expect(sorted.map((o) => o.id)).toEqual(['current', 'ended', 'empty']);
    expect(sorted[0].roles.map((r) => r.id)).toEqual(['c-now', 'c-old']);
    expect(orgs[2].roles[0].id).toBe('c-old');
  });

  it('returns an empty list for an empty list', () => {
    expect(sortExperience([])).toEqual([]);
  });
});

describe('formatDuration (FR-15)', () => {
  it.each([
    [{ start: '2020-01', end: '2021-08' }, '1 yr 8 mos'],
    [{ start: '2020-01', end: '2021-12' }, '2 yrs'],
    [{ start: '2020-01', end: '2020-12' }, '1 yr'],
    [{ start: '2020-01', end: '2020-05' }, '5 mos'],
    [{ start: '2020-03', end: '2020-03' }, '1 mo'],
    [{ start: '2020-01', end: '2021-01' }, '1 yr 1 mo'],
  ])('%o is %s', (period, expected) => {
    expect(formatDuration(period, NOW)).toBe(expected);
  });

  it('runs an open role to the current month', () => {
    expect(monthsIn({ start: '2025-12' }, NOW)).toBe(12);
    expect(formatDuration({ start: '2025-12' }, NOW)).toBe('1 yr');
    expect(formatDuration({ start: '2026-11', end: null }, NOW)).toBe('1 mo');
  });

  it('never goes below one month, even if the end is before the start', () => {
    expect(monthsIn({ start: '2021-05', end: '2021-01' }, NOW)).toBe(1);
  });
});

describe('formatPeriod (FR-15)', () => {
  it('shows "Present" for an open role', () => {
    expect(formatPeriod({ start: '2020-01' })).toBe(`Jan 2020 – ${PRESENT}`);
    expect(formatPeriod({ start: '2020-01', end: null })).toBe('Jan 2020 – Present');
  });

  it('shows both months for an ended role, ignoring any day', () => {
    expect(formatPeriod({ start: '2013-03-15', end: '2016-12' })).toBe('Mar 2013 – Dec 2016');
  });
});

describe('years (FR-11, FR-31)', () => {
  it('counts whole years since the career start', () => {
    expect(yearsSince('2013-03', NOW)).toBe(13);
    expect(yearsSince('2013-12', NOW)).toBe(12);
    expect(formatYearsPlus(yearsSince('2013-03', NOW))).toBe('13+');
  });

  it('never returns a negative number of years', () => {
    expect(yearsSince('2030-01', NOW)).toBe(0);
  });

  it('computes skill years as current year minus the start year, at least 1', () => {
    expect(skillYears(2013, NOW)).toBe(13);
    expect(skillYears(2026, NOW)).toBe(1);
  });

  it('uses UTC, so the year does not change with the build machine time zone', () => {
    expect(skillYears(2020, new Date('2026-12-31T23:30:00Z'))).toBe(6);
    expect(skillYears(2020, new Date('2027-01-01T00:30:00Z'))).toBe(7);
  });
});

describe('counters (FR-11)', () => {
  it('derives every stat from the data', () => {
    const experience = [
      { roles: [{ start: '2020-01' }, { start: '2018-01', end: '2019-01' }] },
      { roles: [{ start: '2015-01', end: '2017-01' }] },
    ];
    expect(
      counters({ experience, projects: [1, 2, 3], skills: Array(34).fill(0), posts: [1] }),
    ).toEqual({ organizations: 2, roles: 3, projects: 3, technologies: 34, articles: 1 });
  });

  it('is all zeros for empty data', () => {
    expect(counters({ experience: [], projects: [], skills: [], posts: [] })).toEqual({
      organizations: 0,
      roles: 0,
      projects: 0,
      technologies: 0,
      articles: 0,
    });
  });
});

describe('CLOCK', () => {
  it('defaults to the system clock', () => {
    expect(TestBed.inject(CLOCK)).toBe(systemClock);
  });

  it('can be replaced with a fixed clock in tests', () => {
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => NOW }] });
    expect(TestBed.inject(CLOCK)()).toBe(NOW);
  });
});
