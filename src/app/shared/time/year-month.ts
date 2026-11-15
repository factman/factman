/**
 * A calendar month. Content dates are months (`2021-08`), matching LinkedIn and the résumés, or a
 * bare year (`2018`) when the month isn't known.
 */
export interface YearMonth {
  readonly year: number;
  /** 1 to 12. A bare year counts as January for ordering and durations. */
  readonly month: number;
  /** True when the source gave only the year: it is shown as `2018`, never `Jan 2018`. */
  readonly yearOnly?: boolean;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const PATTERN = /^(\d{4})(?:-(0[1-9]|1[0-2])(?:-\d{2})?)?$/;

/**
 * Parses `YYYY-MM`, `YYYY-MM-DD` (day ignored) or a bare `YYYY`. Throws on anything else, so bad
 * data fails the build.
 */
export function parseYearMonth(value: string): YearMonth {
  const match = PATTERN.exec(value);
  if (!match) throw new Error(`Expected a YYYY-MM or YYYY date, got "${value}"`);
  if (!match[2]) return { year: Number(match[1]), month: 1, yearOnly: true };
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** The month a `Date` falls in, in UTC so the result does not depend on the build machine's zone. */
export const yearMonthOf = (date: Date): YearMonth => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
});

/** Months since year 0: lets two months be compared or subtracted as numbers. */
export const monthIndex = ({ year, month }: YearMonth): number => year * 12 + month - 1;

/** `Aug 2021`, or `2018` for a bare year. Fixed English names, so every build renders the same. */
export const formatYearMonth = ({ year, month, yearOnly }: YearMonth): string =>
  yearOnly ? String(year) : `${MONTH_NAMES[month - 1]} ${year}`;
