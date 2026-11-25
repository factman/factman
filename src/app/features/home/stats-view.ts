import {
  contributionLevels,
  type ContributionSnapshot,
  formatPeriod,
  isCurrent,
  monthIndex,
  type Organization,
  parseYearMonth,
  sortExperience,
  summarizeContributions,
  yearMonthOf,
  yearsSince,
} from '@shared';
import type { CareerRow, GlanceStat } from '@ui/molecules';
import type { StatsContributions } from '@ui/organisms';

/** What the counters are counted from (FR-31): each list is the parsed content file. */
export interface StatSources {
  experience: readonly Organization[];
  projects: readonly unknown[];
  skills: readonly unknown[];
  /** Medium articles, once the feed has loaded; leave out to hide the counter. */
  articles?: number;
}

/** The counter cards: years, organizations, roles, projects, technologies and articles. */
export function statCounters(src: StatSources, careerStart: string, now: Date): GlanceStat[] {
  const roles = src.experience.reduce((n, org) => n + org.roles.length, 0);
  return [
    { value: yearsSince(careerStart, now), suffix: '+', label: 'Years of experience' },
    { value: src.experience.length, label: 'Organizations' },
    { value: roles, label: 'Roles' },
    { value: src.projects.length, label: 'Projects' },
    { value: src.skills.length, label: 'Technologies' },
    ...(src.articles ? [{ value: src.articles, label: 'Articles' }] : []),
  ];
}

/** Rows on the strip: the newest organizations, then the rest folded into "Earlier roles". */
export const STRIP_ROWS = 4;

/**
 * The CareerStrip's rows and ticks (FR-32): each role as a bar on a careerStart → now axis, in
 * percentages, with its period as the label; the newest three organizations get a row each and
 * the rest share "Earlier roles". Ticks are every three years, ending at "now".
 */
export function careerStrip(
  experience: readonly Organization[],
  careerStart: string,
  now: Date,
): { rows: CareerRow[]; ticks: string[] } {
  const start = monthIndex(parseYearMonth(careerStart));
  const end = monthIndex(yearMonthOf(now));
  const span = Math.max(1, end - start);
  const pct = (m: number) => Math.round(((m - start) / span) * 10000) / 100;
  const sorted = sortExperience(experience);
  const series = [1, 2, 3, 4, 5] as const;

  const barsOf = (org: Organization, s: (typeof series)[number]) =>
    org.roles.map((role) => {
      const from = monthIndex(parseYearMonth(role.start));
      const to = isCurrent(role) ? end : monthIndex(parseYearMonth(role.end!));
      const left = Math.max(0, pct(from));
      return {
        label: `${org.organization}: ${role.title} · ${formatPeriod(role)}`,
        left,
        width: Math.max(0.6, Math.min(100, pct(to)) - left),
        series: s,
      };
    });

  const rows: CareerRow[] = sorted
    .slice(0, STRIP_ROWS - 1)
    .map((org, i) => ({ org: org.organization, bars: barsOf(org, series[i]) }));
  const earlier = sorted.slice(STRIP_ROWS - 1);
  if (earlier.length) {
    rows.push({ org: 'Earlier roles', bars: earlier.flatMap((org) => barsOf(org, series[4])) });
  }

  const first = parseYearMonth(careerStart).year;
  const last = now.getUTCFullYear();
  const ticks: string[] = [];
  for (let y = first; y <= last - 2; y += 3) ticks.push(String(y));
  ticks.push('now');
  return { rows, ticks };
}

const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const NUMBER = new Intl.NumberFormat('en-GB');

/**
 * The GitHub contribution graph's inputs (FR-33) from the build-time snapshot: each day's shade,
 * a label at each month's first week, and the sentence that is its text alternative. Undefined
 * (the graph hides) when there is no snapshot.
 */
export function contributionGraph(
  snapshot: ContributionSnapshot | null | undefined,
): StatsContributions | undefined {
  if (!snapshot || snapshot.weeks.length === 0) return undefined;
  const start = Date.parse(`${snapshot.start}T00:00:00Z`);
  const months: { label: string; week: number }[] = [];
  snapshot.weeks.forEach((_, week) => {
    const label = MONTH.format(start + week * 7 * 86_400_000);
    if (months.at(-1)?.label !== label) months.push({ label, week });
  });
  // A label squeezed in before the first full month would overlap the next one.
  if (months.length > 1 && months[1].week - months[0].week < 2) months.shift();

  const s = summarizeContributions(snapshot);
  const plural = (n: number, one: string) => `${NUMBER.format(n)} ${one}${n === 1 ? '' : 's'}`;
  const summary =
    s.total === 0
      ? 'No contributions in the last year.'
      : [
          `${plural(s.total, 'contribution')} in the last year, on ${plural(s.activeDays, 'day')}.`,
          s.busiestDay &&
            `Busiest day: ${NUMBER.format(s.busiestDay.count)} on ${DAY.format(Date.parse(`${s.busiestDay.date}T00:00:00Z`))}.`,
          `Longest streak: ${plural(s.longestStreak, 'day')}.`,
        ]
          .filter(Boolean)
          .join(' ');
  return { levels: contributionLevels(snapshot.weeks), months, summary, profileUrl: snapshot.url };
}
