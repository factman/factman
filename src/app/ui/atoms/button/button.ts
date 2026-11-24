import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../icon/icon';
import type { IconDef } from '../icon/icon-def';
import { parseHref } from '../link/href';
import { spinnerRing } from '../spinner/ring';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

/** Icon size per button size, as in the design system. */
const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 20, xl: 24 };

/**
 * The design system's button. A `<button>` by default; with `href` it is a link that looks like a
 * button: `routerLink` for paths in this app, a plain link for other sites (new tab, with a
 * hidden "opens in a new tab" note), `mailto:` and `tel:`.
 *
 * `pressed` fires on activation, and never while disabled or loading. Use it rather than
 * `(click)` on the element.
 * @level atom
 */
@Component({
  selector: 'fm-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './button.scss',
  imports: [Icon, NgTemplateOutlet, RouterLink],
  host: { style: 'display: contents' },
  templateUrl: './button.html',
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  /** Render as a link to this path or URL (see `parseHref`). */
  readonly href = input<string>();
  /** Open the link in a new tab. Defaults to yes for other sites, no for app paths, mail and phone. */
  readonly newTab = input<boolean>();
  readonly leadingIcon = input<IconDef | string>();
  readonly trailingIcon = input<IconDef | string>();
  /**
   * Shows a spinner in place of the leading icon and blocks activation. The button stays enabled
   * and focusable (`aria-busy`), so a keyboard user who pressed it keeps their place (ETE-250).
   */
  readonly loading = input(false);
  readonly disabled = input(false);
  /** A toggle's state (`aria-pressed`); leave unset for ordinary buttons. */
  readonly toggled = input<boolean>();
  /** Stretch to the container's width. */
  readonly full = input(false);
  /** Square, icon only (used by IconButton). Requires `ariaLabel`. */
  readonly iconOnly = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string>();
  readonly ariaHaspopup = input<'dialog' | 'menu' | 'true'>();
  readonly ariaExpanded = input<boolean>();
  readonly ariaControls = input<string>();

  /** Activation (click, Enter or Space), never while disabled or loading. */
  readonly pressed = output<MouseEvent>();

  protected readonly link = computed(() => {
    const href = this.href();
    return href ? parseHref(href) : undefined;
  });
  protected readonly opensNewTab = computed(() => {
    const link = this.link();
    if (!link || link.kind !== 'external' || this.disabled()) return false;
    return this.newTab() ?? link.opensNewTab;
  });
  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);
  /** The design system's ring geometry for this icon size. */
  protected readonly ring = computed(() => spinnerRing(this.iconSize()));
  protected readonly classes = computed(() =>
    [
      'fm-btn',
      `fm-btn--${this.variant()}`,
      `fm-btn--${this.size()}`,
      this.iconOnly() && 'fm-btn--icon icon-target',
      this.toggled() && 'is-pressed',
      this.loading() && 'is-loading',
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected activate(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      return;
    }
    this.pressed.emit(event);
  }
}
