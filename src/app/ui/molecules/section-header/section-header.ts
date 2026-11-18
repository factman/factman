import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * The top of a page section: a numbered eyebrow ("01 · Services"), the title and an intro, with
 * room on the right for an action (projected, e.g. "All projects"). `level` sets the heading
 * level so each page keeps a correct outline (h1 on its own page, h2 for home sections).
 * @level molecule
 */
@Component({
  selector: 'fm-section-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './section-header.scss',
  host: { style: 'display: contents' },
  templateUrl: './section-header.html',
})
export class SectionHeader {
  /** The section number, e.g. "01". */
  readonly index = input<string>();
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly level = input<1 | 2 | 3>(2);
  readonly align = input<'start' | 'center'>('start');
  /** An id for the heading, so the section can be `aria-labelledby` it. */
  readonly headingId = input<string>();
}
