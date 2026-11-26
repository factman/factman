import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Icon } from '@ui/atoms/icon/icon';
import { type IconDef } from '@ui/atoms/icon/icon-def';
import { iconChevronRight } from '@ui/atoms/icon/icons';

export interface ListItem {
  title: string;
  description?: string;
  /** Text on the right, e.g. a date or a number. */
  value?: string;
  icon?: IconDef | string;
  /** Makes the row a link: a path in this app. */
  href?: string;
}

/**
 * Rows of short facts or links: icon, title, description and a value on the right. Rows with an
 * `href` are links with a chevron. `inset` groups the rows in one glass panel.
 * @level molecule
 */
@Component({
  selector: 'fm-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './list.scss',
  imports: [Icon, NgTemplateOutlet, RouterLink],
  host: { style: 'display: contents' },
  templateUrl: './list.html',
})
export class List {
  readonly items = input.required<readonly ListItem[]>();
  readonly variant = input<'plain' | 'inset'>('plain');

  protected readonly chevron = iconChevronRight;
}
