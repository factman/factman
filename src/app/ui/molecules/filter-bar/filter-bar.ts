import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Button,
  Chip,
  type ChipToggle,
  Select,
  type SelectOption,
  TextInput,
  iconSearch,
} from '@ui/atoms';

export interface FilterOption {
  value: string;
  label: string;
  /** How many items match, shown after the label. */
  count?: number;
}

/** What the bar sends whenever the visitor changes a filter. */
export interface FilterState {
  selected: string[];
  query: string;
  sort: string | undefined;
}

/**
 * The projects list's filters: a group of toggle chips (`aria-pressed`), an optional search box
 * and sort list, and "Clear filters" while anything is set. It emits the whole state on every
 * change; the page filters the list. `selected`, `query` and `sort` set the starting state.
 * @level molecule
 */
@Component({
  selector: 'fm-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './filter-bar.scss',
  imports: [Button, Chip, FormsModule, Select, TextInput],
  host: { style: 'display: contents' },
  templateUrl: './filter-bar.html',
})
export class FilterBar {
  readonly options = input.required<readonly FilterOption[]>();
  readonly selected = input<readonly string[]>([]);
  /** Names the chip group, e.g. "Filter by type". */
  readonly label = input('Filters');
  /** Shows a search box with this accessible name, e.g. "Search projects". */
  readonly searchLabel = input<string>();
  readonly query = input('');
  /** Shows a sort list with these options. */
  readonly sortOptions = input<readonly SelectOption[]>();
  readonly sort = input<string>();

  readonly filterChange = output<FilterState>();

  protected readonly searchIcon = iconSearch;
  protected readonly chosen = linkedSignal(() => [...this.selected()]);
  protected readonly text = linkedSignal(() => this.query());
  protected readonly order = linkedSignal(() => this.sort());
  protected readonly active = computed(() => this.chosen().length > 0 || this.text() !== '');

  protected toggle({ value, selected }: ChipToggle): void {
    if (!value) return;
    this.chosen.update((list) => (selected ? [...list, value] : list.filter((v) => v !== value)));
    this.emit();
  }

  protected search(query: string): void {
    this.text.set(query);
    this.emit();
  }

  protected sortBy(sort: string): void {
    this.order.set(sort);
    this.emit();
  }

  protected clear(): void {
    this.chosen.set([]);
    this.text.set('');
    this.emit();
  }

  private emit(): void {
    this.filterChange.emit({ selected: this.chosen(), query: this.text(), sort: this.order() });
  }
}
