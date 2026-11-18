import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

/**
 * The floating box a `[fmTooltip]` shows. Not used directly: the directive creates it on the page
 * body and positions it next to its element.
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
    '[hidden]': '!open()',
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
  /** The pointer moved onto or off the tooltip, which keeps it open (WCAG 1.4.13). */
  readonly hovered = output<boolean>();
}
