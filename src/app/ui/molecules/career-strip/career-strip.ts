import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { fieldId } from '@ui/atoms/form-control/value-control';

export interface CareerBar {
  /** "CTO · Jan 2024 – Present": the tooltip and the screen-reader text. */
  label: string;
  /** Start and length on the axis, as percentages (0–100). */
  left: number;
  width: number;
  /** Chart colour, 1–5 (`--chart-series-n`). */
  series?: 1 | 2 | 3 | 4 | 5;
}

export interface CareerRow {
  org: string;
  bars: readonly CareerBar[];
}

/**
 * Roles on a time axis (2013 → now), one row per organisation; overlapping bars are concurrent
 * roles. The page computes rows and ticks from experience.json (`@shared/experience`). The bars
 * are a picture; screen readers get the same roles as a list.
 * @level molecule
 */
@Component({
  selector: 'fm-career-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './career-strip.scss',
  host: { style: 'display: contents' },
  templateUrl: './career-strip.html',
})
export class CareerStrip {
  readonly rows = input.required<readonly CareerRow[]>();
  /** Axis labels, spread evenly: ['2013', '2016', …, 'now']. */
  readonly ticks = input.required<readonly string[]>();
  readonly caption = input('Career strip');
  readonly description = input('Roles on a 2013 → now axis. Overlaps are concurrent roles.');

  protected readonly captionId = fieldId('fm-career-strip');
}
