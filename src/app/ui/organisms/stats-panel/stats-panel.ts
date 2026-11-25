import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import {
  type CareerRow,
  CareerStrip,
  ContributionGraph,
  type ContributionMonth,
  type GlanceStat,
  StatCounter,
} from '@ui/molecules';

/** The GitHub contribution graph's inputs (FR-33), prepared by the page from the snapshot. */
export interface StatsContributions {
  levels: readonly (readonly number[])[];
  months: readonly ContributionMonth[];
  summary: string;
  profileUrl: string;
}

/**
 * "By the numbers" (FR-31, FR-32, the canvas's StatsSection): counter cards that count up once
 * when they scroll into view (the final value under reduced motion and in the prerendered HTML),
 * beside the CareerStrip, then the GitHub contribution graph when the page gives one (FR-33, P1).
 * Every figure is counted from the data by the page; nothing is typed in.
 * @level organism
 */
@Component({
  selector: 'fm-stats-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // stats-panel* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './stats-panel.scss',
  imports: [CareerStrip, ContributionGraph, StatCounter],
  host: { style: 'display: contents' },
  templateUrl: './stats-panel.html',
})
export class StatsPanel {
  readonly counters = input.required<readonly GlanceStat[]>();
  readonly career = input<readonly CareerRow[]>([]);
  readonly ticks = input<readonly string[]>([]);
  /** The contribution graph; left out (no snapshot, or the flag off), it is not shown. */
  readonly contributions = input<StatsContributions>();
}
