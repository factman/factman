import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type ChipSize = 'sm' | 'md' | 'lg' | 'xl';

/** What `toggled` sends: the chip's value and the state it should take. */
export interface ChipToggle {
  value: string | undefined;
  selected: boolean;
}

/**
 * A compact option. With `selected` set (true or false) it is a toggle button with `aria-pressed`,
 * as in a filter bar; `toggled` asks the parent to flip it. Without `selected` it is static text.
 * The parent owns the state.
 * @level atom
 */
@Component({
  selector: 'fm-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './chip.scss',
  imports: [NgTemplateOutlet],
  host: { style: 'display: contents' },
  templateUrl: './chip.html',
})
export class Chip {
  /** Toggle state. Leave it out for a static chip. */
  readonly selected = input<boolean>();
  /** Identifies the option in `toggled`, e.g. a filter key. */
  readonly value = input<string>();
  readonly size = input<ChipSize>('md');
  readonly disabled = input(false);

  readonly toggled = output<ChipToggle>();

  protected readonly selectable = computed(() => this.selected() !== undefined);
  protected readonly classes = computed(() => {
    const c = ['fm-chip'];
    if (this.size() !== 'md') c.push(`fm-chip--${this.size()}`);
    if (this.selected()) c.push('is-selected');
    if (this.disabled()) c.push('is-disabled');
    return c.join(' ');
  });

  protected toggle(): void {
    if (this.disabled()) return;
    this.toggled.emit({ value: this.value(), selected: !this.selected() });
  }
}
