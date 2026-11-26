import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  linkedSignal,
  output,
} from '@angular/core';

import { fieldId } from '@ui/atoms/form-control/value-control';
import { Icon } from '@ui/atoms/icon/icon';
import { iconChevronDown } from '@ui/atoms/icon/icons';

export interface AccordionItem {
  id: string;
  title: string;
  /** The answer or detail, shown when the item is open. */
  content: string;
}

/**
 * Questions and answers (the FAQ): each title is a button with `aria-expanded` that shows or
 * hides its answer. One open at a time unless `multiple`. A closed answer is
 * `hidden="until-found"`, so the browser's find-in-page reaches it and opens it; answers aren't
 * landmark regions, which would add one per question to the landmarks list (ETE-255).
 * `expanded` sets which are open; `expandedChange` reports the open ids.
 * @level molecule
 */
@Component({
  selector: 'fm-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './accordion.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  templateUrl: './accordion.html',
})
export class Accordion {
  readonly items = input.required<readonly AccordionItem[]>();
  readonly multiple = input(false);
  readonly expanded = input<readonly string[]>([]);
  /** Heading level of the titles, so they sit right in the page outline. */
  readonly headingLevel = input<2 | 3 | 4>(3);

  readonly expandedChange = output<string[]>();

  protected readonly chevron = iconChevronDown;
  protected readonly prefix = fieldId('fm-accordion');
  protected readonly open = linkedSignal(() => [...this.expanded()]);

  /** Find-in-page matched text in a closed answer: open it (and close the others, unless multiple). */
  protected reveal(id: string): void {
    if (!this.open().includes(id)) this.toggle(id);
  }

  protected toggle(id: string): void {
    const isOpen = this.open().includes(id);
    let next: string[];
    if (isOpen) next = this.open().filter((v) => v !== id);
    else next = this.multiple() ? [...this.open(), id] : [id];
    this.open.set(next);
    this.expandedChange.emit(next);
  }
}
