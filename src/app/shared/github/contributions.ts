/**
 * The GitHub contribution calendar as the site keeps it (FR-33): written by `pnpm sync:github`,
 * read at build time, never fetched by the browser. One count per day, in weeks of seven
 * (Sunday first), oldest first.
 */
export interface ContributionSnapshot {
  login: string;
  url: string;
  /** When the calendar was read (ISO 8601). */
  fetchedAt: string;
  /** The first day of the first week (YYYY-MM-DD). */
  start: string;
  total: number;
  weeks: number[][];
}

/** A day's shade, 0 (none) to 4 (busiest), as GitHub draws it: quartiles of the busy days. */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Shades every day by quartile of the days that have contributions, so one huge day does not
 * wash out the rest. A day with none is 0.
 */
export function contributionLevels(weeks: readonly (readonly number[])[]): ContributionLevel[][] {
  const busy = weeks
    .flat()
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const at = (q: number) => busy[Math.min(busy.length - 1, Math.floor(q * busy.length))] ?? 0;
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)];
  return weeks.map((week) =>
    week.map((n): ContributionLevel => (n <= 0 ? 0 : n <= q1 ? 1 : n <= q2 ? 2 : n <= q3 ? 3 : 4)),
  );
}

/** The figures the graph's text alternative states. */
export interface ContributionSummary {
  total: number;
  activeDays: number;
  busiestDay: { date: string; count: number } | undefined;
  longestStreak: number;
}

/** Adds `days` to a YYYY-MM-DD date (UTC), as YYYY-MM-DD. */
const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Total, active days, the busiest day and the longest run of active days. */
export function summarizeContributions(snapshot: ContributionSnapshot): ContributionSummary {
  const days = snapshot.weeks.flat();
  let busiest: ContributionSummary['busiestDay'];
  let streak = 0;
  let longest = 0;
  days.forEach((count, i) => {
    if (count > 0 && (!busiest || count > busiest.count)) {
      busiest = { date: addDays(snapshot.start, i), count };
    }
    streak = count > 0 ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  });
  return {
    total: snapshot.total,
    activeDays: days.filter((n) => n > 0).length,
    busiestDay: busiest,
    longestStreak: longest,
  };
}
