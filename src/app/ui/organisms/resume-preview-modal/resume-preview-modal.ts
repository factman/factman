import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';

import { type ResumeDownload, Track } from '@shared';
import {
  Button,
  fieldId,
  Icon,
  iconChevronLeft,
  iconChevronRight,
  iconDownload,
  iconExternalLink,
  iconFileText,
  Skeleton,
} from '@ui/atoms';
import { Dialog, WindowFrame } from '@ui/molecules';

/**
 * The résumé preview (FR-44 to FR-46, the canvas's ResumeModal): a code window in the shared
 * Dialog, so focus stays inside, Escape closes it and focus goes back to what opened it. Tabs
 * switch the résumé without closing (ArrowLeft and ArrowRight move between them), the pages show
 * as images with Previous and Next, and the footer has "Open PDF in new tab" and Download.
 * @level organism
 */
@Component({
  selector: 'fm-resume-preview-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // resume-modal* classes are this component's; fm-window__* and fm-etab come from the design system.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './resume-preview-modal.scss',
  imports: [Button, Dialog, Icon, Skeleton, Track, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './resume-preview-modal.html',
})
export class ResumePreviewModal {
  readonly open = input(false);
  readonly resumes = input.required<readonly ResumeDownload[]>();
  /** The résumé shown (its slug); the first when it matches none. */
  readonly variant = input<string>();

  readonly closed = output<void>();
  /** A tab was chosen: the page keeps `variant` in step (the modal stays open). */
  readonly variantChange = output<string>();
  /** Download the résumé (its slug). */
  readonly download = output<string>();

  protected readonly current = computed(
    () => this.resumes().find((r) => r.slug === this.variant()) ?? this.resumes()[0],
  );
  /** The page shown, back to 1 whenever the résumé changes. */
  protected readonly page = linkedSignal({ source: this.current, computation: () => 1 });
  /** The page image has loaded; until then a skeleton page holds its place. */
  protected readonly loaded = signal(false);
  protected readonly image = computed(() => this.current()?.previews[this.page() - 1]);
  protected readonly pageCount = computed(() => this.current()?.previews.length ?? 0);

  protected readonly panelId = fieldId('fm-resume-modal-panel');
  protected readonly tabPrefix = fieldId('fm-resume-modal-tab');
  protected readonly icons = {
    file: iconFileText,
    prev: iconChevronLeft,
    next: iconChevronRight,
    external: iconExternalLink,
    download: iconDownload,
  };

  protected pick(slug: string): void {
    if (slug === this.current()?.slug) return;
    this.loaded.set(false);
    this.variantChange.emit(slug);
  }

  protected go(step: number): void {
    const page = Math.min(this.pageCount(), Math.max(1, this.page() + step));
    if (page === this.page()) return;
    this.loaded.set(false);
    this.page.set(page);
  }

  /** Arrow keys move between the tabs (and choose the résumé), as in a WAI-ARIA tablist. */
  protected arrow(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const list = this.resumes();
    const at = list.findIndex((r) => r.slug === this.current()?.slug);
    const next = list[(at + (event.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
    this.pick(next.slug);
    const tablist = (event.currentTarget as HTMLElement).parentElement;
    queueMicrotask(() =>
      tablist?.querySelector<HTMLElement>(`#${this.tabPrefix}-${next.slug}`)?.focus(),
    );
  }
}
