import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Project } from '@shared';
import { Button } from '@ui/atoms/button/button';
import { iconArrowUpRight, iconCode, iconLock } from '@ui/atoms/icon/icons';
import { Image } from '@ui/atoms/image/image';
import { Tag, type TagTone } from '@ui/atoms/tag/tag';

const STATUS: Record<Project['status'], { label: string; tone: TagTone }> = {
  completed: { label: 'Completed', tone: 'success' },
  'in-progress': { label: 'In progress', tone: 'info' },
  maintained: { label: 'Maintained', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

const ENGAGE_LABEL: Record<NonNullable<Project['engage']>['mode'], string> = {
  'request-access': 'Request access',
  'request-demo': 'Request a demo',
  contact: 'Ask about it',
};

/**
 * A project in the grid: cover, status, category and years, title, summary and stack. The whole
 * card links to the project page (`href`); the live and source links sit on top as their own
 * targets. A private project has no public links, so it shows its engage action instead (FR-22),
 * which emits `engage` for the page to open the contact flow.
 * @level molecule
 */
@Component({
  selector: 'fm-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './project-card.scss',
  imports: [Button, Image, RouterLink, Tag],
  host: { style: 'display: contents' },
  templateUrl: './project-card.html',
})
export class ProjectCard {
  readonly project = input.required<Project>();
  /** The project's page, e.g. `/projects/investa`. */
  readonly href = input.required<string>();
  /** Heading level of the title, to fit the page outline. */
  readonly headingLevel = input<2 | 3>(3);

  readonly engage = output<Project>();

  protected readonly external = iconArrowUpRight;
  protected readonly code = iconCode;
  protected readonly lock = iconLock;
  protected readonly status = computed(() => STATUS[this.project().status]);
  protected readonly isPrivate = computed(() => this.project().visibility === 'private');
  protected readonly engageLabel = computed(() => {
    const mode = this.project().engage?.mode;
    return mode ? ENGAGE_LABEL[mode] : undefined;
  });
  protected readonly years = computed(() => {
    const { startedAt, completedAt, status } = this.project();
    const from = startedAt.slice(0, 4);
    const to = completedAt?.slice(0, 4) ?? (status === 'archived' ? from : 'now');
    return from === to ? from : `${from}–${to}`;
  });
  protected readonly initials = computed(() => this.project().title.slice(0, 2).toUpperCase());
}
