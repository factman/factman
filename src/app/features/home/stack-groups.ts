import { skillsByCategory } from '@data';
import { type Skill, skillYears } from '@shared';
import {
  iconBraces,
  iconCloud,
  iconCode,
  iconDatabase,
  iconFileCode,
  iconFlame,
  iconGitBranch,
  iconGithub,
  type IconDef,
  iconLayers,
  iconLayout,
  iconMobile,
  iconPackage,
  iconRocket,
  iconServer,
  iconTerminal,
  iconWorkflow,
} from '@ui/atoms';
import type { StackGroup } from '@ui/organisms';

/**
 * The icons skills.json uses, imported one by one (ADR-004) so the page ships only these. A name
 * not listed here shows no icon.
 */
export const SKILL_ICONS: Readonly<Record<string, IconDef>> = {
  braces: iconBraces,
  cloud: iconCloud,
  code: iconCode,
  database: iconDatabase,
  'file-code': iconFileCode,
  flame: iconFlame,
  'git-branch': iconGitBranch,
  github: iconGithub,
  layers: iconLayers,
  layout: iconLayout,
  mobile: iconMobile,
  package: iconPackage,
  rocket: iconRocket,
  server: iconServer,
  terminal: iconTerminal,
  workflow: iconWorkflow,
};

/**
 * The Stack section's groups (FR-11, FR-12): skills by area in display order (featured first),
 * each with its icon and years of use counted from `since` at build time (never stale).
 */
export function stackGroups(skills: readonly Skill[], now: Date): StackGroup[] {
  return skillsByCategory(skills).map((group) => ({
    category: group.category,
    items: group.skills.map((s) => ({
      id: s.id,
      name: s.name,
      icon: SKILL_ICONS[s.icon],
      years: s.since === undefined ? undefined : skillYears(s.since, now),
      featured: s.featured,
    })),
  }));
}
