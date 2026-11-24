import {
  type Client,
  formatDuration,
  formatPeriod,
  formatYearMonth,
  isCurrent,
  type Organization,
  parseYearMonth,
  type Role,
  type Skill,
  sortExperience,
  yearsSince,
} from '@shared';
import type { TimelineEntry, TimelineGlance } from '@ui/organisms';

const TYPE_LABEL: Readonly<Record<NonNullable<Role['type']>, string>> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  freelance: 'Freelance',
  internship: 'Internship',
};

/** An organization's whole span: its first role's start to its latest role's end (or now). */
function span(org: Organization): { start: string; end?: string } {
  const starts = org.roles.map((r) => r.start).sort();
  const open = org.roles.some((r) => !r.end);
  const ends = org.roles.flatMap((r) => (r.end ? [r.end] : [])).sort();
  return { start: starts[0], end: open ? undefined : ends.at(-1) };
}

/**
 * The timeline's entries (FR-13 to FR-16), from experience.json: organizations and their roles in
 * sortExperience order, dates and durations formatted ("Present" for a current role), the untagged
 * highlights the site shows (tagged ones are for the résumés), skill ids as names, and the logo
 * on the plate clients.json gives it (`darkLogos`).
 */
export function timelineEntries(
  experience: readonly Organization[],
  skills: readonly Pick<Skill, 'id' | 'name'>[],
  now: Date,
  darkLogos: ReadonlySet<string> = new Set(),
  assetBase = '/assets/',
): TimelineEntry[] {
  const skillName = new Map(skills.map((s) => [s.id, s.name]));
  return sortExperience(experience).map((org) => ({
    id: org.id,
    organization: org.organization,
    website: org.website,
    logo: org.logo && assetBase + org.logo,
    logoDark: !!org.logo && darkLogos.has(org.logo),
    total:
      org.roles.length > 1
        ? `${formatDuration(span(org), now)} · ${org.roles.length} roles`
        : undefined,
    roles: org.roles.map((role) => ({
      id: role.id,
      title: role.title,
      period: formatPeriod(role),
      duration: formatDuration(role, now),
      location: role.location,
      type: role.type && TYPE_LABEL[role.type],
      summary: role.summary,
      highlights: role.highlights.filter((h): h is string => typeof h === 'string'),
      skills: role.skills.map((id) => skillName.get(id) ?? id),
      current: isCurrent(role),
    })),
  }));
}

/**
 * CareerGlance beside the timeline: the current roles ("Simple Finance · since Jan 2024") and the
 * counts, all computed from the data (years from careerStart, organizations, roles, current roles).
 */
export function careerGlance(
  experience: readonly Organization[],
  careerStart: string,
  now: Date,
  resumeHref = '#resume',
): TimelineGlance {
  const current = sortExperience(experience).flatMap((org) =>
    org.roles.filter(isCurrent).map((role) => ({
      title: role.title,
      description: `${org.organization} · since ${formatYearMonth(parseYearMonth(role.start))}`,
    })),
  );
  const roles = experience.reduce((n, org) => n + org.roles.length, 0);
  return {
    roles: current,
    stats: [
      {
        value: yearsSince(careerStart, now),
        suffix: '+',
        label: `years since ${careerStart.slice(0, 4)}`,
      },
      { value: experience.length, label: 'organizations' },
      { value: roles, label: 'roles' },
      { value: current.length, label: 'current roles' },
    ],
    resumeHref,
  };
}

/** Client logos that need the dark plate, by logo path (clients.json `plate`). */
export const darkLogos = (clients: readonly Pick<Client, 'logo' | 'plate'>[]): Set<string> =>
  new Set(clients.filter((c) => c.plate === 'dark').map((c) => c.logo));
