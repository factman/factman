import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { fieldId } from '@ui/atoms/form-control/value-control';
import { Icon } from '@ui/atoms/icon/icon';
import { iconArrowUpRight } from '@ui/atoms/icon/icons';

/** A month label over the graph, at the week it starts in. */
export interface ContributionMonth {
  label: string;
  week: number;
}

/** One square's size and the step between squares, in SVG units. */
const CELL = 11;
const STEP = 14;
const TOP = 18;

/**
 * GitHub contribution graph (FR-33, P1): a year of days as squares, shaded 0–4 by how busy each
 * was, in the glass card the other charts use. The squares are decoration: the caption states the
 * figures (`summary`), so screen readers get the same facts. Data comes from the build-time
 * snapshot; nothing is fetched from GitHub in the browser.
 * @level molecule
 */
@Component({
  selector: 'fm-contribution-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // contribution-graph* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './contribution-graph.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  templateUrl: './contribution-graph.html',
})
export class ContributionGraph {
  /** Weeks of seven shades (0–4), oldest first, Sunday first. */
  readonly levels = input.required<readonly (readonly number[])[]>();
  readonly months = input<readonly ContributionMonth[]>([]);
  /** The text alternative, shown under the title: "1,234 contributions in the last year …". */
  readonly summary = input.required<string>();
  readonly caption = input('GitHub contributions');
  /** The GitHub profile, linked under the graph. */
  readonly profileUrl = input<string>();
  readonly profileLabel = input('View on GitHub');

  protected readonly captionId = fieldId('fm-contribution-graph');
  protected readonly external = iconArrowUpRight;
  protected readonly legend = [0, 1, 2, 3, 4] as const;
  protected readonly cell = CELL;
  protected readonly squares = computed(() =>
    this.levels().flatMap((week, w) =>
      week.map((level, d) => ({ key: `${w}-${d}`, x: w * STEP, y: TOP + d * STEP, level })),
    ),
  );
  protected readonly labels = computed(() =>
    this.months().map((m) => ({ ...m, x: m.week * STEP })),
  );
  protected readonly viewBox = computed(
    () =>
      `0 0 ${Math.max(1, this.levels().length) * STEP - (STEP - CELL)} ${TOP + 7 * STEP - (STEP - CELL)}`,
  );
}
