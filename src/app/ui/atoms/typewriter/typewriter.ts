import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { Caret } from '../caret/caret';
import { reducedMotion } from '../motion/reduced-motion';

/** Timing from docs/interaction-and-motion.md, in ms. */
export const TYPEWRITER_TIMING = { type: 70, hold: 1600, erase: 30, pause: 300 } as const;

/**
 * Types a word, holds it, erases it and types the next ("Fullstack engineer", "CTO" …), with a
 * blinking caret. The first word is in the HTML from the start (server render, no JS), and the
 * cycle begins after it has been shown. With reduced motion it shows the first word only.
 *
 * Screen readers get every word at once from hidden text; the moving text is hidden from them.
 * @level atom
 */
@Component({
  selector: 'fm-typewriter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [Caret],
  host: { style: 'display: contents' },
  templateUrl: './typewriter.html',
})
export class Typewriter {
  readonly words = input.required<readonly string[]>();
  /** Keep cycling after the last word. Without it, it stops on the last word. */
  readonly loop = input(true);
  /** Fixed text before the words, e.g. "I'm a". */
  readonly prefix = input<string>();
  readonly caret = input(true);

  protected readonly text = signal<string | undefined>(undefined);
  /** Before the cycle starts (and on the server) the first word shows in full. */
  protected readonly shown = computed(() => this.text() ?? this.words()[0] ?? '');
  protected readonly spoken = computed(() =>
    [this.prefix(), this.words().join(', ')].filter(Boolean).join(' '),
  );

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    afterNextRender(() => {
      if (reducedMotion(win) || this.words().length < 2) return;
      this.text.set(this.words()[0]);
      this.wait(TYPEWRITER_TIMING.hold, () => this.erase(0));
    });
  }

  private wait(ms: number, next: () => void): void {
    this.timer = setTimeout(next, ms);
  }

  private erase(index: number): void {
    const current = this.text() ?? '';
    if (current.length === 0) {
      const next = index + 1;
      if (next >= this.words().length && !this.loop()) return;
      this.wait(TYPEWRITER_TIMING.pause, () => this.type(next % this.words().length));
      return;
    }
    this.text.set(current.slice(0, -1));
    this.wait(TYPEWRITER_TIMING.erase, () => this.erase(index));
  }

  private type(index: number): void {
    const word = this.words()[index];
    const current = this.text() ?? '';
    if (current.length === word.length) {
      const last = index === this.words().length - 1;
      if (last && !this.loop()) return;
      this.wait(TYPEWRITER_TIMING.hold, () => this.erase(index));
      return;
    }
    this.text.set(word.slice(0, current.length + 1));
    this.wait(TYPEWRITER_TIMING.type, () => this.type(index));
  }
}
