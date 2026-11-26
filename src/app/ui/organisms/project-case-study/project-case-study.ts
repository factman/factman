import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { type Project, Track } from '@shared';
import { Button } from '@ui/atoms/button/button';
import {
  iconArrowUpRight,
  iconChevronLeft,
  iconChevronRight,
  iconCode,
} from '@ui/atoms/icon/icons';
import { Image } from '@ui/atoms/image/image';
import { SkillChip } from '@ui/atoms/skill-chip/skill-chip';
import { EngageCard } from '@ui/molecules/engage-card/engage-card';
import { type ListItem } from '@ui/molecules/list/list';

/** The next project in the list, for "Next project". */
export interface NextProject {
  title: string;
  href: string;
}

/**
 * The body of a project's page (FR-22, FR-23, the canvas's ProjectCaseStudy): the screenshots,
 * then my role, the stack, the outcome and the project's links beside the EngageCard (sticky from
 * 1024px), and "All projects" / "Next project". A private project never links out: its links are
 * left out and the EngageCard asks for access, a demo or a conversation (`requestAccess`, which the
 * page turns into a prefilled message).
 * @level organism
 */
@Component({
  selector: 'fm-project-case-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // project-case-study* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './project-case-study.scss',
  imports: [Button, EngageCard, Image, SkillChip, Track],
  host: { style: 'display: contents' },
  templateUrl: './project-case-study.html',
})
export class ProjectCaseStudy {
  readonly project = input.required<Project>();
  /** The stack's names (the page looks the skill ids up in skills.json). */
  readonly stack = input<readonly string[]>([]);
  readonly facts = input<readonly ListItem[]>([]);
  readonly next = input<NextProject>();
  readonly similarHref = input('/services');
  /** Where src/assets is served from. */
  readonly assetBase = input('/assets/');

  readonly requestAccess = output<void>();

  protected readonly icons = {
    external: iconArrowUpRight,
    code: iconCode,
    back: iconChevronLeft,
    next: iconChevronRight,
  };
  protected readonly isPublic = computed(() => this.project().visibility === 'public');
  protected readonly gallery = computed(() =>
    (this.project().gallery ?? []).map((src, i) => ({
      src: this.assetBase() + src,
      alt: `${this.project().title}, screenshot ${i + 1}`,
    })),
  );
  /** Outbound links, for public projects only (FR-23). */
  protected readonly links = computed(() => {
    if (!this.isPublic()) return [];
    const { live, source, caseStudy } = this.project().links;
    return [
      ...(live
        ? [{ label: 'Live site', href: live, icon: this.icons.external, type: 'live' as const }]
        : []),
      ...(source
        ? [{ label: 'Source code', href: source, icon: this.icons.code, type: 'source' as const }]
        : []),
      ...(caseStudy
        ? [
            {
              label: 'Case study',
              href: caseStudy,
              icon: this.icons.external,
              type: 'case-study' as const,
            },
          ]
        : []),
    ];
  });
}
