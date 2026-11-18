import { Injectable } from '@angular/core';
import { type SkillGroup, skillsByCategory } from '@data';
import { skills } from '@data/skills';
import type { Skill } from '@shared';

/** Skills for the Stack section and the résumés. Loaded only with the pages that inject it. */
@Injectable({ providedIn: 'root' })
export class SkillsRepository {
  private readonly groups = skillsByCategory(skills);

  all(): readonly Skill[] {
    return skills;
  }

  /** Grouped by area in display order, featured first in each (FR-12). */
  byCategory(): readonly SkillGroup[] {
    return this.groups;
  }
}
