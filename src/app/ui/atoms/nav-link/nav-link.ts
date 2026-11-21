import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { parseHref } from '../link/href';

export type NavLinkSize = 'sm' | 'md';
export type NavLinkVariant = 'pill' | 'underline';
/**
 * Which kind of "current" a nav item is: `page` for the page on screen (`/services`), `location`
 * for the home section in view (fed by scroll-spy). `true` means `page`.
 */
export type NavLinkActive = boolean | 'page' | 'location';

/**
 * One item of the site navigation (DS:NavLink). App paths (`/projects`, `/#contact`) use the
 * router. The active item is highlighted and carries `aria-current`, so screen readers hear it
 * too: `page` for the current page, `location` for the section in view.
 * @level atom
 */
@Component({
  selector: 'fm-nav-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './nav-link.scss',
  imports: [RouterLink],
  host: { style: 'display: contents' },
  templateUrl: './nav-link.html',
})
export class NavLink {
  readonly href = input.required<string>();
  readonly label = input.required<string>();
  readonly active = input<NavLinkActive>(false);
  /** `sm` (32px) in the desktop navbar, `md` (40px) in menus. */
  readonly size = input<NavLinkSize>('md');
  readonly variant = input<NavLinkVariant>('pill');

  protected readonly link = computed(() => parseHref(this.href()));
  protected readonly current = computed(() => {
    const active = this.active();
    if (active === false) return null;
    return active === true ? 'page' : active;
  });
  protected readonly classes = computed(
    () =>
      `fm-navlink fm-navlink--${this.variant()}` +
      (this.size() === 'sm' ? ' fm-navlink--sm' : '') +
      (this.current() ? ' is-active' : ''),
  );
}
