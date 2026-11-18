import type { OrganizationLike } from './experience';

/** The data the stats counters are computed from. Each list is the parsed content file. */
export interface CounterSources {
  readonly experience: readonly OrganizationLike[];
  readonly projects: readonly unknown[];
  readonly skills: readonly unknown[];
  readonly posts: readonly unknown[];
}

/** The stats strip values (FR-11). Derived from the data, never typed in by hand. */
export interface Counters {
  readonly organizations: number;
  readonly roles: number;
  readonly projects: number;
  readonly technologies: number;
  readonly articles: number;
}

export function counters({ experience, projects, skills, posts }: CounterSources): Counters {
  return {
    organizations: experience.length,
    roles: experience.reduce((sum, org) => sum + org.roles.length, 0),
    projects: projects.length,
    technologies: skills.length,
    articles: posts.length,
  };
}
