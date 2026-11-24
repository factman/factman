import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { Icon, iconClose } from '@ui/atoms';

import { type FeedbackTone, TONE_ICON } from '../alert/alert-tone';

/**
 * A short notice that appears over the page after an action ("Email copied"), then closes itself
 * after `duration` ms (0 keeps it). Pointer or focus on it pauses the timer, and the close button
 * closes it at once. Whoever shows it removes it on `closed`.
 *
 * Floating (the default) it is a `popover="manual"` in the top layer, so nothing covers it and
 * nothing light-dismisses it. It is announced with `ariaNotify()` where the browser has it, else
 * through a status region that is in the page before its text arrives. While a modal dialog is
 * open it waits for the dialog to close, so it isn't shown behind an inert page (ETE-253).
 * @level molecule
 */
@Component({
  selector: 'fm-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './toast.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  templateUrl: './toast.html',
})
export class Toast {
  readonly tone = input<FeedbackTone>('success');
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly variant = input<'dark' | 'glass'>('dark');
  /** Milliseconds before it closes itself; 0 keeps it open. */
  readonly duration = input(5000);
  /** Over the page in the top layer (default); false keeps it in the flow (Storybook, docs). */
  readonly floating = input(true);

  readonly closed = output<void>();

  protected readonly close = iconClose;
  protected readonly icon = computed(() => TONE_ICON[this.tone()]);
  protected readonly paused = signal(false);
  /** False until it may show (no modal dialog open). */
  protected readonly shown = signal(false);
  /** Text for the status region when the browser has no `ariaNotify()`. */
  protected readonly announcement = signal('');
  protected readonly popover = computed(() =>
    this.floating() && this.popoverSupported ? 'manual' : null,
  );
  protected readonly classes = computed(
    () => `fm-toast fm-toast--${this.variant()} fm-tone--${this.tone()}`,
  );

  private readonly doc = inject(DOCUMENT);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly popoverSupported =
    typeof this.doc.createElement('div').showPopover === 'function';
  private timer: ReturnType<typeof setTimeout> | undefined;
  private remaining = 0;
  private started = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => clearTimeout(this.timer));
    afterNextRender(() => {
      const modal = this.openModal();
      if (!modal) return this.start();
      const later = () => this.start();
      modal.addEventListener('close', later, { once: true });
      destroyRef.onDestroy(() => modal.removeEventListener('close', later));
    });
  }

  /** Shows it, announces it and starts the timer. */
  private start(): void {
    this.shown.set(true);
    const panel = this.panel().nativeElement;
    if (this.popover() && !panel.matches(':popover-open')) panel.showPopover();
    this.announce();
    this.remaining = this.duration();
    this.run();
  }

  private announce(): void {
    const text = [this.title(), this.description()].filter(Boolean).join('. ');
    const notify = (this.doc as Document & { ariaNotify?: (text: string) => void }).ariaNotify;
    if (typeof notify === 'function') notify.call(this.doc, text);
    else this.announcement.set(text);
  }

  /** An open modal dialog, which makes the rest of the page inert. */
  private openModal(): HTMLDialogElement | null {
    try {
      return this.doc.querySelector<HTMLDialogElement>('dialog:modal');
    } catch {
      return null; // a browser (or test DOM) without :modal
    }
  }

  protected pause(on: boolean): void {
    if (!this.duration() || this.paused() === on) return;
    this.paused.set(on);
    if (on) {
      clearTimeout(this.timer);
      this.remaining -= Date.now() - this.started;
    } else {
      this.run();
    }
  }

  private run(): void {
    if (this.remaining <= 0) return;
    this.started = Date.now();
    this.timer = setTimeout(() => this.closed.emit(), this.remaining);
  }
}
