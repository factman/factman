import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
}

export type TableRow = Record<string, string | number>;

/**
 * A data table, such as the privacy page's list of cookies. The `caption` names it (shown as the
 * table's title); column headers are `th` with `scope="col"`, and the first cell of each row is a
 * row header. It scrolls sideways on narrow screens, and the scroll area can take keyboard focus.
 * @level molecule
 */
@Component({
  selector: 'fm-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './table.scss',
  host: { style: 'display: contents' },
  templateUrl: './table.html',
})
export class Table {
  readonly columns = input.required<readonly TableColumn[]>();
  readonly rows = input.required<readonly TableRow[]>();
  readonly caption = input.required<string>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');
}
