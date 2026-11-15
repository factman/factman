import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../icon/icon';
import { iconArrowUpRight } from '../icon/icons';
import { parseHref } from './href';

/**
 * A text link in running text. Paths in this app (`/projects`, `#contact`) use the router; other
 * sites open in a new tab with `rel="noopener noreferrer"`, an arrow and a hidden
 * "(opens in a new tab)" note; `mailto:` and `tel:` open in place.
 * Underlined, so it never relies on colour alone.
 * @level atom
 */
@Component({
  selector: 'fm-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // .fm-link is this site's class; the design system styles links only inside its components.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './link.scss',
  imports: [Icon, NgTemplateOutlet, RouterLink],
  host: { style: 'display: contents' },
  template: `
    <ng-template #inner>
      <ng-content />
      @if (opensNewTab()) {
        <fm-icon [icon]="arrow" [size]="16" /><span class="fm-sr"> (opens in a new tab)</span>
      }
    </ng-template>
    @let target = link();
    @if (target.kind === 'router') {
      <a
        class="fm-link"
        [routerLink]="target.path"
        [queryParams]="target.queryParams"
        [fragment]="target.fragment"
        ><ng-container [ngTemplateOutlet]="inner"
      /></a>
    } @else {
      <a
        class="fm-link"
        [attr.href]="target.url"
        [attr.target]="opensNewTab() ? '_blank' : null"
        [attr.rel]="opensNewTab() ? 'noopener noreferrer' : null"
        ><ng-container [ngTemplateOutlet]="inner"
      /></a>
    }
  `,
})
export class Link {
  readonly href = input.required<string>();
  /** Open in a new tab. Defaults to yes for other sites, no for app paths, mail and phone. */
  readonly newTab = input<boolean>();

  protected readonly arrow = iconArrowUpRight;
  protected readonly link = computed(() => parseHref(this.href()));
  protected readonly opensNewTab = computed(() => {
    const link = this.link();
    return link.kind === 'external' && (this.newTab() ?? link.opensNewTab);
  });
}
