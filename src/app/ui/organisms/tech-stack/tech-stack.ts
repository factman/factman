import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';

import { Chip, Icon, type IconDef } from '@ui/atoms';

/** One technology: its name, an icon, years of use (from `since`) and whether it is featured. */
export interface StackItem {
  id: string;
  name: string;
  icon?: IconDef | string;
  /** Years of use, computed by the page; left out when the start year is unknown. */
  years?: number;
  featured?: boolean;
}

/** One area ("Frontend") and its technologies, in display order. */
export interface StackGroup {
  category: string;
  items: readonly StackItem[];
}

/** The filter's "everything" option. */
export const ALL = 'All';

/**
 * The Stack section's body (FR-11, FR-12), inside the page's SectionLayout (`#stack`): a row of
 * category chips that filters the areas (P1), the areas on a glass panel with their technologies,
 * each with its icon and years of use (featured ones first and marked), and a live summary
 * ("34 technologies across 7 areas"). The page computes the groups and years from skills.json.
 * @level organism
 */
@Component({
  selector: 'fm-tech-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // tech-stack* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './tech-stack.scss',
  imports: [Chip, Icon],
  host: { style: 'display: contents' },
  templateUrl: './tech-stack.html',
})
export class TechStack {
  readonly groups = input.required<readonly StackGroup[]>();
  /** Shows the category chips. */
  readonly filter = input(true);

  protected readonly selected = signal(ALL);
  protected readonly categories = computed(() => [ALL, ...this.groups().map((g) => g.category)]);
  protected readonly shown = computed(() => {
    const pick = this.selected();
    return pick === ALL ? this.groups() : this.groups().filter((g) => g.category === pick);
  });
  protected readonly summary = computed(() => {
    const count = this.shown().reduce((n, g) => n + g.items.length, 0);
    const what = `${count} ${count === 1 ? 'technology' : 'technologies'}`;
    const pick = this.selected();
    if (pick !== ALL) return `${what} in ${pick}`;
    const areas = this.groups().length;
    return `${what} across ${areas} ${areas === 1 ? 'area' : 'areas'}`;
  });

  protected select(category: string): void {
    this.selected.set(category);
  }
}
