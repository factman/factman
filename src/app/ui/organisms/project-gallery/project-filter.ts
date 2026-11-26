import type { Project } from '@shared';
import type { FilterOption } from '@ui/molecules/filter-bar/filter-bar';

/** The gallery's filter: statuses and categories (any of each), and a search. */
export interface ProjectFilter {
  status: readonly Project['status'][];
  category: readonly string[];
  query: string;
}

export const NO_FILTER: ProjectFilter = { status: [], category: [], query: '' };

const STATUS_LABEL: Record<Project['status'], string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  maintained: 'Maintained',
  archived: 'Archived',
};
const STATUS_ORDER = Object.keys(STATUS_LABEL) as Project['status'][];

/** True when no filter is set. */
export const isEmptyFilter = (f: ProjectFilter): boolean =>
  !f.status.length && !f.category.length && !f.query.trim();

/**
 * The projects that match: any of the chosen statuses, any of the chosen categories, and the
 * search in the title, summary, category or stack (case-insensitive). Order is kept.
 */
export function filterProjects<
  T extends Pick<Project, 'title' | 'summary' | 'category' | 'status' | 'stack'>,
>(projects: readonly T[], filter: ProjectFilter): T[] {
  const q = filter.query.trim().toLowerCase();
  return projects.filter(
    (p) =>
      (!filter.status.length || filter.status.includes(p.status)) &&
      (!filter.category.length || filter.category.includes(p.category)) &&
      (!q || [p.title, p.summary, p.category, ...p.stack].join(' ').toLowerCase().includes(q)),
  );
}

/**
 * FilterBar's chips: the statuses, then the categories, each with how many projects it has. Values
 * are prefixed (`status:archived`, `category:Web`) so one chip group carries both.
 */
export function filterOptions(
  projects: readonly Pick<Project, 'status' | 'category'>[],
): FilterOption[] {
  const count = <K extends 'status' | 'category'>(key: K, value: string) =>
    projects.filter((p) => p[key] === value).length;
  const statuses = STATUS_ORDER.filter((s) => count('status', s) > 0).map((s) => ({
    value: `status:${s}`,
    label: STATUS_LABEL[s],
    count: count('status', s),
  }));
  const categories = [...new Set(projects.map((p) => p.category))].sort().map((c) => ({
    value: `category:${c}`,
    label: c,
    count: count('category', c),
  }));
  return [...statuses, ...categories];
}

/** FilterBar's selected chip values for a filter. */
export const selectedValues = (f: ProjectFilter): string[] => [
  ...f.status.map((s) => `status:${s}`),
  ...f.category.map((c) => `category:${c}`),
];

/** A filter from FilterBar's chip values and search. Unknown statuses are dropped. */
export function fromSelection(selected: readonly string[], query: string): ProjectFilter {
  const pick = (prefix: string) =>
    selected.filter((v) => v.startsWith(prefix)).map((v) => v.slice(prefix.length));
  return {
    status: pick('status:').filter((s): s is Project['status'] => s in STATUS_LABEL),
    category: pick('category:'),
    query,
  };
}

/** The filter as URL query params (`?status=archived,completed&category=Web&q=api`). */
export function toQueryParams(f: ProjectFilter): Record<string, string | null> {
  return {
    status: f.status.length ? f.status.join(',') : null,
    category: f.category.length ? f.category.join(',') : null,
    q: f.query.trim() || null,
  };
}

/** A filter from URL query params; anything unknown is ignored. */
export function fromQueryParams(params: { get(name: string): string | null }): ProjectFilter {
  const list = (name: string) =>
    (params.get(name) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return {
    status: list('status').filter((s): s is Project['status'] => s in STATUS_LABEL),
    category: list('category'),
    query: params.get('q') ?? '',
  };
}
