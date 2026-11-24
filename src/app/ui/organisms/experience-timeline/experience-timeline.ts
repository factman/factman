import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  signal,
} from '@angular/core';

import { Icon, iconArrowUpRight, iconChevronDown, iconChevronUp, SkillChip, Tag } from '@ui/atoms';
import { CareerGlance, type GlanceRole, type GlanceStat } from '@ui/molecules';

/** One role, ready to show: the page formats the dates and picks the site's highlights. */
export interface TimelineRole {
  id: string;
  title: string;
  /** "Jan 2024 – Present". */
  period: string;
  /** "2 yrs 11 mos". */
  duration: string;
  location?: string;
  /** "Full-time". */
  type?: string;
  summary?: string;
  highlights: readonly string[];
  /** Skill names. */
  skills: readonly string[];
  current: boolean;
}

/** One organization and its roles, newest first. */
export interface TimelineEntry {
  id: string;
  organization: string;
  /** Links the name, in a new tab. */
  website?: string;
  /** Logo URL; without one the rail shows initials. */
  logo?: string;
  /** White artwork: the logo sits on a dark plate. */
  logoDark?: boolean;
  /** "8 yrs 7 mos · 2 roles", for organizations with more than one role. */
  total?: string;
  roles: readonly TimelineRole[];
}

/** The side panel: CareerGlance's data. */
export interface TimelineGlance {
  roles: readonly GlanceRole[];
  stats: readonly GlanceStat[];
  resumeHref: string;
}

/** Highlights shown before "Show more" (FR-16). */
export const PREVIEW = 2;

/** "Simple Finance" → "SF". */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * The Experience section's body (FR-13 to FR-16), inside the page's SectionLayout (`#experience`):
 * the organizations in order (the page sorts them with sortExperience), each on a rail with its
 * logo, with its roles newest first. A role shows its dates, duration ("Present" when current),
 * location and type, a summary, the first highlights with a keyboard-operable "Show more", and its
 * skills as chips. CareerGlance sits beside the timeline (sticky from 1024px).
 * @level organism
 */
@Component({
  selector: 'fm-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // experience-timeline* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './experience-timeline.scss',
  imports: [CareerGlance, Icon, SkillChip, Tag],
  host: { style: 'display: contents' },
  templateUrl: './experience-timeline.html',
})
export class ExperienceTimeline {
  readonly entries = input.required<readonly TimelineEntry[]>();
  readonly glance = input<TimelineGlance>();
  /** Highlights shown before "Show more". */
  readonly preview = input(PREVIEW);

  protected readonly icons = {
    external: iconArrowUpRight,
    more: iconChevronDown,
    less: iconChevronUp,
  };
  protected readonly initials = initials;
  private readonly open = signal<ReadonlySet<string>>(new Set());

  protected isOpen(roleId: string): boolean {
    return this.open().has(roleId);
  }

  /** Find-in-page matched a collapsed highlight: open that role's list. */
  protected reveal(roleId: string): void {
    if (!this.isOpen(roleId)) this.toggle(roleId);
  }

  protected toggle(roleId: string): void {
    this.open.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(roleId)) next.add(roleId);
      return next;
    });
  }
}
