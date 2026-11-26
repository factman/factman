import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';

import { Reveal, ScrollSpy } from '@shared';
import { SectionHeader } from '@ui/molecules/section-header/section-header';

/**
 * One page section: an anchor (`sectionId`, e.g. `#services`) that the header's scroll-spy tracks
 * (FR-37), the numbered SectionHeader, and the body. The section is named by its title, keeps the
 * shared vertical rhythm, and its body reveals on scroll. Put a header action (e.g. "All projects")
 * in `[sectionAction]`; everything else is the body.
 * @level template
 */
@Component({
  selector: 'fm-section-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './section-layout.scss',
  imports: [Reveal, SectionHeader],
  host: { style: 'display: contents' },
  templateUrl: './section-layout.html',
})
export class SectionLayout {
  /** The section's id: its anchor and its scroll-spy key. */
  readonly sectionId = input.required<string>();
  readonly index = input<string>();
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly level = input<1 | 2 | 3>(2);
  readonly align = input<'start' | 'center'>('start');
  /** Less vertical space, for short sections. */
  readonly tight = input(false);

  protected readonly headingId = computed(() => `${this.sectionId()}-title`);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const spy = inject(ScrollSpy);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const section = host.querySelector('section');
      if (!section) return;
      const stop = spy.register(this.sectionId(), section);
      destroyRef.onDestroy(stop);
    });
  }
}
