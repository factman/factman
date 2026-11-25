import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { prefersReducedMotion, ScrollSpy, type SiteNavItem } from '@shared';
import {
  Button,
  IconButton,
  Logo,
  NavLink,
  type NavLinkActive,
  iconArrowRight,
  iconClose,
  iconFileText,
  iconMenu,
} from '@ui/atoms';
import { type Theme, ThemeToggle } from '@ui/molecules';

/** The page the header sits on: the home page uses section anchors, the others use routes. */
export type SiteHeaderPage = 'home' | 'services' | 'projects' | 'blog' | 'other';

export interface SiteHeaderLink {
  id: string;
  label: string;
  href: string;
  active: NavLinkActive;
}

/** The full navbar shows from this width; below it the menu button and its panel take over. */
const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * The site header (FR-02, FR-03): a fixed glass bar with the logo (back to the top), the primary
 * navigation from site.json, the Résumé button, the theme toggle and "Book a service". Below
 * 1024px the links and buttons move into a menu panel right after the menu button: focus moves
 * into it on open, Tab carries on through it to the page (no focus trap: it isn't modal, ETE-257),
 * and it closes when focus or a click leaves the header. Escape closes it and returns focus to
 * the button.
 *
 * On the home page links jump to sections (`/#about`) and the section in view is highlighted
 * (scroll-spy, FR-37); elsewhere links open their page (`/services`) or the home section.
 * It doesn't change the theme or open the résumé itself: it emits `themeChange` and `openResume`.
 * @level organism
 */
@Component({
  selector: 'fm-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // site-header* classes are this component's; it also rounds the design system's buttons.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './site-header.scss',
  imports: [Button, IconButton, Logo, NavLink, RouterLink, ThemeToggle],
  host: { style: 'display: contents', '(document:click)': 'clickOutside($event)' },
  templateUrl: './site-header.html',
})
export class SiteHeader {
  readonly nav = input.required<readonly SiteNavItem[]>();
  readonly current = input<SiteHeaderPage>('other');
  readonly theme = input.required<Theme>();
  /**
   * The home section in view. Left out, the header follows ScrollSpy; set it to pin one (stories,
   * tests).
   */
  readonly active = input<string>();

  readonly openResume = output<void>();
  readonly themeChange = output<Theme>();

  protected readonly icons = { arrowRight: iconArrowRight, fileText: iconFileText };
  protected readonly menuId = 'site-header-menu';
  protected readonly menuOpen = signal(false);
  protected readonly menuIcon = computed(() => (this.menuOpen() ? iconClose : iconMenu));

  private readonly spy = inject(ScrollSpy);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly menuButton = viewChild.required<ElementRef<HTMLElement>>('menuButton');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly home = computed(() => this.current() === 'home');
  protected readonly links = computed<SiteHeaderLink[]>(() => {
    const home = this.home();
    const page = this.current();
    const inView = this.active() ?? this.spy.active();
    return this.nav().map((item) => {
      const anchor = `/${item.anchor}`;
      let active: NavLinkActive = false;
      if (home && inView === item.id) active = 'location';
      else if (!home && page === item.id) active = 'page';
      return {
        id: item.id,
        label: item.label,
        href: home ? anchor : (item.route ?? anchor),
        active,
      };
    });
  });

  constructor() {
    // Growing past the breakpoint hides the panel, so close it rather than leave it open unseen.
    const media = this.document.defaultView?.matchMedia?.(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) this.menuOpen.set(false);
    };
    media?.addEventListener?.('change', onChange);
    inject(DestroyRef).onDestroy(() => media?.removeEventListener?.('change', onChange));
    // Keyboard, focus and link handling for the whole header, attached once rather than as
    // template bindings on non-interactive elements: Escape while the panel is open, closing it
    // when focus leaves the header, and when one of its links is followed (by mouse or keyboard,
    // both fire `click`).
    afterNextRender(() => {
      const root = this.root().nativeElement;
      root.addEventListener('keydown', (e) => this.keydown(e));
      root.addEventListener('focusout', (e) => this.focusOut(e, root));
      root.addEventListener('click', (e) => this.panelClick(e));
    });
  }

  protected toggleMenu(): void {
    if (this.menuOpen()) this.closeMenu(true);
    else this.openMenu();
  }

  protected openMenu(): void {
    this.menuOpen.set(true);
    afterNextRender(() => this.focusables()[0]?.focus(), { injector: this.injector });
  }

  /** Closes the panel; `restoreFocus` puts focus back on the menu button (Escape, the button). */
  protected closeMenu(restoreFocus = false): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (restoreFocus) this.menuButtonElement()?.focus();
  }

  /**
   * Asks the page to open the résumé. From the panel, focus first goes back to the menu button,
   * so the dialog returns focus there when it closes (the panel is gone by then).
   */
  protected requestResume(): void {
    this.closeMenu(true);
    this.openResume.emit();
  }

  /** The logo on the home page goes back to the top instead of reloading the page. */
  protected goHome(event: MouseEvent): void {
    this.closeMenu();
    if (!this.home()) return;
    event.preventDefault();
    const win = this.document.defaultView;
    win?.scrollTo({ top: 0, behavior: prefersReducedMotion(win) ? 'auto' : 'smooth' });
  }

  /** A link in the panel was followed: the page changes or scrolls, so the panel closes. */
  private panelClick(event: Event): void {
    const panel = this.panel()?.nativeElement;
    const link = (event.target as Element | null)?.closest?.('a');
    if (panel && link && panel.contains(link)) this.closeMenu();
  }

  /** Escape closes the panel and puts focus back on the menu button. */
  private keydown(event: KeyboardEvent): void {
    if (!this.menuOpen() || event.key !== 'Escape') return;
    event.preventDefault();
    this.closeMenu(true);
  }

  /** Focus left the header (Tab past the panel's last item): close the panel where focus went. */
  private focusOut(event: FocusEvent, root: HTMLElement): void {
    const next = event.relatedTarget as Node | null;
    if (next && root.contains(next)) return;
    this.closeMenu();
  }

  /** A click anywhere outside the header closes the panel. */
  protected clickOutside(event: Event): void {
    if (!this.menuOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.root().nativeElement.contains(target)) this.closeMenu();
  }

  private menuButtonElement(): HTMLElement | null {
    return this.menuButton().nativeElement.querySelector<HTMLElement>('button');
  }

  private focusables(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    return panel
      ? Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      : [];
  }
}
