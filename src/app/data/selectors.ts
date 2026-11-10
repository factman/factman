import type { Client, Project, Service, Skill } from '@shared';

/** Pure selectors over the content data. No Angular, no I/O: easy to unit test. */

/** Orders records by their `order` field, lowest first; the input is not modified. */
export const byOrder = <T extends { order: number }>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/** Services in display order (catalogue, home grid). */
export const servicesByOrder = (services: readonly Service[]): Service[] => byOrder(services);

/** One service by its URL slug, or `undefined`. */
export const serviceBySlug = (services: readonly Service[], slug: string): Service | undefined =>
  services.find((s) => s.slug === slug);

/** Up to `limit` other services after the current one, wrapping round ("Often booked together"). */
export function relatedServices(services: readonly Service[], slug: string, limit = 4): Service[] {
  const ordered = servicesByOrder(services);
  const at = ordered.findIndex((s) => s.slug === slug);
  if (at < 0) return ordered.slice(0, limit);
  const rest = [...ordered.slice(at + 1), ...ordered.slice(0, at)];
  return rest.slice(0, limit);
}

/** Clients in display order ("Worked with" strip). */
export const clientsByOrder = (clients: readonly Client[]): Client[] => byOrder(clients);

/** At most this many projects on the home grid (FR-20, DS-08). */
export const MAX_FEATURED_PROJECTS = 6;

/**
 * Projects newest first, by `startedAt` (`2020`, `2019-03`, …: the strings sort as dates). Equal
 * dates keep their file order. The input is not modified.
 */
export const projectsByRecency = (projects: readonly Project[]): Project[] =>
  [...projects].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

/** The home grid: featured projects, newest first, at most `limit` (FR-20). */
export const featuredProjects = (
  projects: readonly Project[],
  limit = MAX_FEATURED_PROJECTS,
): Project[] => projectsByRecency(projects.filter((p) => p.featured)).slice(0, limit);

/** One project by its URL slug, or `undefined`. */
export const projectBySlug = (projects: readonly Project[], slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);

/** The Stack section's areas, in display order (the `category` enum in skills.schema.json). */
export const SKILL_CATEGORIES: readonly Skill['category'][] = [
  'Languages',
  'Frontend',
  'Backend',
  'Mobile',
  'Data',
  'Cloud & DevOps',
  'Tools',
];

export interface SkillGroup {
  readonly category: Skill['category'];
  readonly skills: readonly Skill[];
}

/**
 * Skills grouped by area in display order, empty areas left out (FR-12). Within an area: featured
 * first, then the longest-used, then by name; skills without a start year come after those with one.
 */
export function skillsByCategory(skills: readonly Skill[]): SkillGroup[] {
  // No start year sorts after every real year (a finite value, so two unknowns compare as 0).
  const rank = (s: Skill) => s.since ?? 9999;
  return SKILL_CATEGORIES.map((category) => ({
    category,
    skills: skills
      .filter((s) => s.category === category)
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          rank(a) - rank(b) ||
          a.name.localeCompare(b.name),
      ),
  })).filter((g) => g.skills.length > 0);
}

/** Anything with a publish date (`YYYY-MM-DD` or an ISO date-time), such as a blog post. */
export interface Dated {
  readonly publishedAt: string;
}

/** The newest `limit` posts for the home "Writing" section (FR-24). The input is not modified. */
export const newestPosts = <T extends Dated>(posts: readonly T[], limit = 3): T[] =>
  [...posts].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit);
