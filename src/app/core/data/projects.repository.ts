import { Injectable } from '@angular/core';
import { featuredProjects, projectBySlug, projectsByRecency } from '@data';
import { projects } from '@data/projects';
import type { Project } from '@shared';

/**
 * Projects data for pages and resolvers. `providedIn: 'root'` and never registered eagerly, so
 * projects.json ships only in the lazy chunks that inject this repository (ADR-002).
 */
@Injectable({ providedIn: 'root' })
export class ProjectsRepository {
  private readonly ordered = projectsByRecency(projects);

  /** Every project, newest first (/projects). */
  all(): readonly Project[] {
    return this.ordered;
  }

  /** The home grid: at most 6 featured projects, newest first. */
  featured(): Project[] {
    return featuredProjects(this.ordered);
  }

  bySlug(slug: string): Project | undefined {
    return projectBySlug(this.ordered, slug);
  }

  /** Every project slug: the prerender list for /projects/:slug. */
  slugs(): string[] {
    return this.ordered.map((p) => p.slug);
  }
}
