/** A calendar month. Content dates are months (`2021-08`), matching LinkedIn and the résumés. */
export interface YearMonth {
  readonly year: number;
  /** 1 to 12. */
  readonly month: number;
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

const PATTERN = /^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?$/;

/** Parses `YYYY-MM` (or `YYYY-MM-DD`, day ignored). Throws on anything else, so bad data fails the build. */
export function parseYearMonth(value: string): YearMonth {
  const match = PATTERN.exec(value);
  if (!match) throw new Error(`Expected a YYYY-MM date, got "${value}"`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** The month a `Date` falls in, in UTC so the result does not depend on the build machine's zone. */
export const yearMonthOf = (date: Date): YearMonth => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
});

/** Months since year 0: lets two months be compared or subtracted as numbers. */
export const monthIndex = ({ year, month }: YearMonth): number => year * 12 + month - 1;

/** `Aug 2021`. English month names, fixed, so prerendered HTML is the same on every machine. */
export const formatYearMonth = ({ year, month }: YearMonth): string =>
  `${MONTH_NAMES[month - 1]} ${year}`;
