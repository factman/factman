import {
  formatYearMonth,
  monthIndex,
  parseYearMonth,
  yearMonthOf,
  type YearMonth,
} from '../time/year-month';

/** Anything with a start month and an optional end month. No end means it is current (FR-13). */
export interface Period {
  readonly start: string;
  readonly end?: string | null;
}

/** An organization with its roles, as in `experience.json` (ETE-29). */
export interface OrganizationLike<R extends Period = Period> {
  readonly roles: readonly R[];
}

export const PRESENT = 'Present';

export const isCurrent = (period: Period): boolean => !period.end;

const startIndex = (period: Period): number => monthIndex(parseYearMonth(period.start));

/** Sort comparator: current before ended, then newer start month first. 0 for equal keys. */
export const compareRecency = (a: Period, b: Period): number =>
  Number(isCurrent(b)) - Number(isCurrent(a)) || startIndex(b) - startIndex(a);

/**
 * Current roles first, then ended roles; each group by start month, newest first (FR-13, UT-01).
 * Equal keys keep their input order (Array.prototype.sort is stable). The input is not modified.
 */
export const sortByRecency = <T extends Period>(items: readonly T[]): T[] =>
  [...items].sort(compareRecency);

/**
 * Orders the experience timeline: roles within each organization by recency, then organizations
 * by their most recent role, using the same rule. Organizations without roles go last.
 */
export function sortExperience<R extends Period, O extends OrganizationLike<R>>(
  organizations: readonly O[],
): O[] {
  return organizations
    .map((org) => ({ ...org, roles: sortByRecency(org.roles) }))
    .sort((a, b) => {
      const [la, lb] = [a.roles[0], b.roles[0]];
      if (!la || !lb) return Number(!la) - Number(!lb);
      return compareRecency(la, lb);
    });
}

/**
 * Whole months in a period, counting both the first and the last month, as LinkedIn does:
 * Jan 2020 to Aug 2021 is 20 months. An open period runs to the clock's current month.
 */
export function monthsIn(period: Period, now: Date): number {
  const start = parseYearMonth(period.start);
  const end: YearMonth = period.end ? parseYearMonth(period.end) : yearMonthOf(now);
  return Math.max(1, monthIndex(end) - monthIndex(start) + 1);
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** `1 yr 8 mos`, `2 yrs`, `5 mos`, `1 mo` (FR-15). Never empty: the shortest period is one month. */
export function formatDuration(period: Period, now: Date): string {
  const total = monthsIn(period, now);
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts = [];
  if (years) parts.push(plural(years, 'yr', 'yrs'));
  if (months) parts.push(plural(months, 'mo', 'mos'));
  return parts.join(' ');
}

/** `Jan 2020 – Aug 2021`, or `Jan 2020 – Present` for a current role (FR-15). */
export function formatPeriod(period: Period): string {
  const start = formatYearMonth(parseYearMonth(period.start));
  const end = period.end ? formatYearMonth(parseYearMonth(period.end)) : PRESENT;
  return `${start} – ${end}`;
}
