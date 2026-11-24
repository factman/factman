import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { type CareerRow, CareerStrip, type GlanceStat, StatCounter } from '@ui/molecules';

/**
 * "By the numbers" (FR-31, FR-32, the canvas's StatsSection): counter cards that count up once
 * when they scroll into view (the final value under reduced motion and in the prerendered HTML),
 * beside the CareerStrip. Every figure is counted from the data by the page; nothing is typed in.
 * @level organism
 */
@Component({
  selector: 'fm-stats-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // stats-panel* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './stats-panel.scss',
  imports: [CareerStrip, StatCounter],
  host: { style: 'display: contents' },
  templateUrl: './stats-panel.html',
})
export class StatsPanel {
  readonly counters = input.required<readonly GlanceStat[]>();
  readonly career = input<readonly CareerRow[]>([]);
  readonly ticks = input<readonly string[]>([]);
}
