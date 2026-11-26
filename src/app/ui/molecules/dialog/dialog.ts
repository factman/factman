import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { fieldId } from '@ui/atoms/form-control/value-control';
import { IconButton } from '@ui/atoms/icon-button/icon-button';
import { iconClose } from '@ui/atoms/icon/icons';

/**
 * A modal dialog over the page, the shell for the résumé preview and the scheduler. It is a native
 * `<dialog>` opened with `showModal()`, so the rest of the page is inert (focus stays inside),
 * Escape closes it and, on close, the browser puts focus back on whatever opened it. A click on
 * the backdrop closes it (`closedby="any"`, with a click fallback where that is missing), and
 * scrolling inside it or over the backdrop doesn't scroll the page (CSS `overscroll-behavior`, no
 * root `overflow` lock: ETE-252). The parent owns `open`; `closed` asks it to close. Projected
 * content is the body; put buttons in `[dialogFooter]`.
 * @level molecule
 */
@Component({
  selector: 'fm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './dialog.scss',
  imports: [IconButton],
  host: { style: 'display: contents' },
  templateUrl: './dialog.html',
})
export class Dialog {
  readonly open = input(false);
  /** The dialog's title, and its accessible name. */
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /**
   * Bare: no title bar, body or footer of its own; the content projected with `[dialogBare]`
   * fills the panel (a window-framed viewer, ResumePreviewModal). `label` names the dialog.
   */
  readonly bare = input(false);

  readonly closed = output<void>();

  protected readonly close = iconClose;
  protected readonly titleId = fieldId('fm-dialog');
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly doc = inject(DOCUMENT);
  /** Only for browsers without `showModal()`, which don't restore focus themselves. */
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open()) this.show(el);
      else this.hide(el);
    });
    // Light dismiss: closedby="any" where supported; elsewhere a click on the backdrop. A pointer
    // convenience (keyboards use Escape), so the fallback is attached here, not as a (click)
    // binding.
    afterNextRender(() => {
      const el: HTMLElement = this.dialog().nativeElement;
      if (!('closedBy' in el)) el.addEventListener('click', (e: MouseEvent) => this.backdrop(e));
    });
  }

  /** Escape: the browser would close it; let the parent decide instead. */
  protected cancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  /** The browser closed it itself (light dismiss it would not let us cancel): tell the parent. */
  protected nativeClose(): void {
    if (this.open()) this.closed.emit();
  }

  /** A click on the backdrop (the dialog element itself, outside the panel) closes it. */
  private backdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.closed.emit();
  }

  private show(el: HTMLDialogElement): void {
    if (el.open) return;
    if (typeof el.showModal === 'function') {
      el.showModal();
    } else {
      this.opener = this.doc.activeElement as HTMLElement | null;
      el.setAttribute('open', '');
    }
  }

  private hide(el: HTMLDialogElement): void {
    if (!el.open && !el.hasAttribute('open')) return;
    if (typeof el.close === 'function') {
      el.close(); // restores focus to the opener
    } else {
      el.removeAttribute('open');
      this.opener?.focus?.();
    }
    this.opener = null;
  }
}
