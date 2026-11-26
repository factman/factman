import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '@ui/atoms/icon/icon';
import { iconChevronRight } from '@ui/atoms/icon/icons';

export interface Crumb {
  label: string;
  /** A path in this app. The last crumb is the current page and needs none. */
  href?: string;
}

/**
 * Where a page sits in the site: Home › Projects › Investa. A `nav` named "Breadcrumb"; the last
 * crumb is the current page (`aria-current="page"`), the others are links.
 * @level molecule
 */
@Component({
  selector: 'fm-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './breadcrumbs.scss',
  imports: [Icon, RouterLink],
  host: { style: 'display: contents' },
  templateUrl: './breadcrumbs.html',
})
export class Breadcrumbs {
  readonly crumbs = input.required<readonly Crumb[]>();

  protected readonly chevron = iconChevronRight;
}
