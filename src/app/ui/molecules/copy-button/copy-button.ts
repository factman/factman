import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Button, type ButtonSize, type ButtonVariant, iconCheck, iconCopy } from '@ui/atoms';

import { copyText } from './clipboard';

/** How long the button says "Copied" before it resets, in ms. */
export const COPIED_FOR = 2000;

/**
 * Copies `value` (an email address, a phone number) to the clipboard. The button shows a tick and
 * "Copied" for two seconds, and a polite live region tells screen readers. If copying fails, the
 * live region says so and the value stays visible for the visitor to copy by hand.
 * @level molecule
 */
@Component({
  selector: 'fm-copy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  host: { style: 'display: contents' },
  templateUrl: './copy-button.html',
})
export class CopyButton {
  /** The text to copy. */
  readonly value = input.required<string>();
  /** The button text, e.g. "Copy email". */
  readonly label = input('Copy');
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('sm');

  readonly copied = output<string>();

  private readonly doc = inject(DOCUMENT);
  protected readonly state = signal<'idle' | 'copied' | 'failed'>('idle');
  protected readonly icon = computed(() => (this.state() === 'copied' ? iconCheck : iconCopy));
  protected readonly text = computed(() => (this.state() === 'copied' ? 'Copied' : this.label()));
  protected readonly announcement = computed(() => {
    if (this.state() === 'copied') return `Copied ${this.value()} to the clipboard`;
    if (this.state() === 'failed') return `Couldn't copy. Select ${this.value()} and copy it.`;
    return '';
  });

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected async copy(): Promise<void> {
    const value = this.value();
    const ok = await copyText(value, this.doc);
    this.state.set(ok ? 'copied' : 'failed');
    if (ok) this.copied.emit(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), COPIED_FOR);
  }
}
