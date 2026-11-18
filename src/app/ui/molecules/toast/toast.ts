import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Icon, iconClose } from '@ui/atoms';

import { type FeedbackTone, TONE_ICON } from '../alert/alert-tone';

/**
 * A short notice that appears over the page after an action ("Email copied"), then closes itself
 * after `duration` ms (0 keeps it). It is a polite live region; pointer or focus on it pauses the
 * timer, and the close button closes it at once. Whoever shows it removes it on `closed`.
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

  readonly closed = output<void>();

  protected readonly close = iconClose;
  protected readonly icon = computed(() => TONE_ICON[this.tone()]);
  protected readonly paused = signal(false);
  protected readonly classes = computed(
    () => `fm-toast fm-toast--${this.variant()} fm-tone--${this.tone()}`,
  );

  private timer: ReturnType<typeof setTimeout> | undefined;
  private remaining = 0;
  private started = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterNextRender(() => {
      this.remaining = this.duration();
      this.run();
    });
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
