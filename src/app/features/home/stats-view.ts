import {
  formatPeriod,
  isCurrent,
  monthIndex,
  type Organization,
  parseYearMonth,
  sortExperience,
  yearMonthOf,
  yearsSince,
} from '@shared';
import type { CareerRow, GlanceStat } from '@ui/molecules';

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
