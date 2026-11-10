import { monthIndex, parseYearMonth, yearMonthOf } from '../time/year-month';

/**
 * Whole years from a month (`2013-03`) to now (FR-11). The hero's "13+ years" is
 * `formatYearsPlus(yearsSince(careerStart, now))`; with prerendering it is computed at build time.
 */
export function yearsSince(start: string, now: Date): number {
  const months = monthIndex(yearMonthOf(now)) - monthIndex(parseYearMonth(start));
  return Math.max(0, Math.floor(months / 12));
}

/** Years using a skill: `current year - since` (FR-31). Never below 1, so a new skill shows "1 yr". */
export const skillYears = (since: number, now: Date): number =>
  Math.max(1, now.getUTCFullYear() - since);

/** `13+`. */
export const formatYearsPlus = (years: number): string => `${years}+`;
