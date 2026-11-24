import type { Project } from '@shared';

import {
  filterOptions,
  filterProjects,
  fromQueryParams,
  fromSelection,
  isEmptyFilter,
  NO_FILTER,
  selectedValues,
  toQueryParams,
} from './project-filter';

const projects = [
  {
    title: 'GraphUI',
    summary: 'Plot graphs',
    category: 'Open source',
    status: 'maintained',
    stack: ['TypeScript'],
  },
  {
    title: 'NeoClock',
    summary: 'A clock',
    category: 'Web',
    status: 'archived',
    stack: ['JavaScript'],
  },
  {
    title: 'ToDo App',
    summary: 'A to-do list',
    category: 'Web',
    status: 'archived',
    stack: ['JavaScript'],
  },
  {
    title: 'Covid API',
    summary: 'Daily figures',
    category: 'API',
    status: 'completed',
    stack: ['Node.js'],
  },
] as unknown as Pick<Project, 'title' | 'summary' | 'category' | 'status' | 'stack'>[];

describe('filterProjects', () => {
  it('keeps everything with no filter', () => {
    expect(filterProjects(projects, NO_FILTER)).toHaveLength(4);
  });

  it('matches any chosen status and any chosen category, and both together', () => {
    const titles = (f: Parameters<typeof filterProjects>[1]) =>
      filterProjects(projects, f).map((p) => p.title);
    expect(titles({ ...NO_FILTER, status: ['archived', 'completed'] })).toEqual([
      'NeoClock',
      'ToDo App',
      'Covid API',
    ]);
    expect(titles({ ...NO_FILTER, category: ['Web', 'API'] })).toHaveLength(3);
    expect(titles({ status: ['completed'], category: ['Web'], query: '' })).toEqual([]);
  });

  it('searches the title, summary, category and stack, ignoring case', () => {
    expect(filterProjects(projects, { ...NO_FILTER, query: 'node' }).map((p) => p.title)).toEqual([
      'Covid API',
    ]);
    expect(filterProjects(projects, { ...NO_FILTER, query: ' CLOCK ' })).toHaveLength(1);
  });
});

describe('filterOptions', () => {
  it('lists the statuses in order, then the categories, with counts', () => {
    expect(filterOptions(projects).map((o) => `${o.value} ${o.count}`)).toEqual([
      'status:completed 1',
      'status:maintained 1',
      'status:archived 2',
      'category:API 1',
      'category:Open source 1',
      'category:Web 2',
    ]);
  });
});

describe('selection and the URL', () => {
  const filter = { status: ['archived'] as const, category: ['Web'], query: 'clock' };

  it('round-trips through FilterBar values', () => {
    expect(fromSelection(selectedValues(filter as never), 'clock')).toEqual(filter);
    expect(fromSelection(['status:bogus', 'category:Web'], '').status).toEqual([]);
  });

  it('round-trips through the URL query, dropping empty and unknown values', () => {
    const params = toQueryParams(filter as never);
    expect(params).toEqual({ status: 'archived', category: 'Web', q: 'clock' });
    const map = new Map(Object.entries(params));
    expect(fromQueryParams({ get: (k) => map.get(k) ?? null })).toEqual(filter);
    expect(toQueryParams(NO_FILTER)).toEqual({ status: null, category: null, q: null });
    expect(
      fromQueryParams({ get: (k) => (k === 'status' ? 'nope,archived' : null) }).status,
    ).toEqual(['archived']);
  });

  it('knows when nothing is filtered', () => {
    expect(isEmptyFilter(NO_FILTER)).toBe(true);
    expect(isEmptyFilter({ ...NO_FILTER, query: '  ' })).toBe(true);
    expect(isEmptyFilter(filter as never)).toBe(false);
  });
});
