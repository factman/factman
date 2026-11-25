import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import type { TooltipPlacement } from './tooltip';

/**
 * The floating box a `[fmTooltip]` shows. Not used directly: the directive creates it on the page
 * body. Where the browser has popovers it is a `popover="hint"` (or `manual`) in the top layer, so
 * it shows above an open dialog; elsewhere it is shown and hidden with `hidden`.
 * @level atom
 */
@Component({
  selector: 'fm-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './tooltip.scss',
  host: {
    role: 'tooltip',
    class: 'tooltip-panel',
    '[id]': 'panelId()',
    '[attr.popover]': 'popover()',
    '[hidden]': '!popover() && !open()',
    '[class.is-anchored]': 'anchored()',
    '[attr.data-placement]': 'placement()',
    '(mouseenter)': 'hovered.emit(true)',
    '(mouseleave)': 'hovered.emit(false)',
  },
  template: `<span class="fm-tooltip fm-tooltip--dark"
    ><span class="fm-tooltip__body">{{ text() }}</span></span
  >`,
})
export class TooltipPanel {
  readonly panelId = input.required<string>();
  readonly text = input.required<string>();
  readonly open = input(false);
  /** The popover mode the browser supports (`hint`, else `manual`); null without popovers. */
  readonly popover = input<'hint' | 'manual' | null>(null);
  /** Placed by CSS anchor positioning (the directive sets `position-anchor`). */
  readonly anchored = input(false);
  readonly placement = input<TooltipPlacement>('top');
  /** The pointer moved onto or off the tooltip, which keeps it open (WCAG 1.4.13). */
  readonly hovered = output<boolean>();
}
