import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';

import type { IconDef } from './icon-def';
import { IconRegistry } from './icon-registry';

/** The design system's sizes: 16 inline with small text, 20 in controls, 24 on its own. */
export type IconSize = 16 | 20 | 24 | number;

/**
 * An icon from the design system's set, drawn inline as SVG in the current text colour
 * (`currentColor`), so a parent sets its colour with an `--icon-*` or `--text-*` token.
 *
 * Pass an icon you import (`[icon]="iconArrowRight"` from `@ui/atoms`), so only the icons in use
 * end up in a bundle (ADR-004). A plain name (`icon="cloud"`) works for icons chosen by data,
 * once the page registers them with `provideIcons()`.
 *
 * Decorative by default (`aria-hidden`). Give it a `label` when the icon carries meaning on its
 * own, such as an icon-only link.
 * @level atom
 */
@Component({
  selector: 'fm-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  templateUrl: './icon.html',
})
export class Icon {
  /** The icon: an imported `IconDef`, or the name of a registered one. */
  readonly icon = input.required<IconDef | string>();
  /** Width and height in px. */
  readonly size = input<IconSize>(24);
  /** Accessible name. Leave it out for decorative icons next to text. */
  readonly label = input<string>();

  private readonly registry = inject(IconRegistry);

  protected readonly def = computed(() => {
    const icon = this.icon();
    if (typeof icon !== 'string') return icon;
    const found = this.registry.get(icon);
    if (!found && isDevMode())
      console.warn(`fm-icon: "${icon}" is not registered; add it with provideIcons()`);
    return found;
  });
}
