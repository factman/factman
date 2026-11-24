import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { IconButton, fieldId, iconClose } from '@ui/atoms';

/**
 * A modal dialog over the page, the shell for the résumé preview and the scheduler. It is a native
 * `<dialog>` opened with `showModal()`, so the rest of the page is inert (focus stays inside) and
 * Escape closes it. While it is open the page doesn't scroll, and on close focus goes back to
 * whatever opened it. The parent owns `open`; `closed` asks it to close (Escape, the close button,
 * a click on the backdrop). Projected content is the body; put buttons in `[dialogFooter]`.
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
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open()) this.show(el);
      else this.hide(el);
    });
    // A click on the backdrop closes it: a pointer convenience (keyboards use Escape), so it is
    // attached here rather than as a template (click) binding.
    afterNextRender(() =>
      this.dialog().nativeElement.addEventListener('click', (e) => this.backdrop(e)),
    );
    inject(DestroyRef).onDestroy(() => this.unlockScroll());
  }

  /** Escape: the browser would close it; let the parent decide instead. */
  protected cancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  /** A click on the backdrop (the dialog element itself, outside the panel) closes it. */
  private backdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.closed.emit();
  }

  private show(el: HTMLDialogElement): void {
    if (el.open) return;
    this.opener = this.doc.activeElement as HTMLElement | null;
    if (typeof el.showModal === 'function') el.showModal();
    else el.setAttribute('open', '');
    this.doc.documentElement.classList.add('dialog-scroll-lock');
  }

  private hide(el: HTMLDialogElement): void {
    if (!el.open && !el.hasAttribute('open')) return;
    if (typeof el.close === 'function') el.close();
    else el.removeAttribute('open');
    this.unlockScroll();
    this.opener?.focus?.();
    this.opener = null;
  }

  private unlockScroll(): void {
    this.doc.documentElement.classList.remove('dialog-scroll-lock');
  }
}
