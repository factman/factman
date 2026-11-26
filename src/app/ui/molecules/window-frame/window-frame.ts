import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { IconButton } from '@ui/atoms/icon-button/icon-button';
import { iconClose } from '@ui/atoms/icon/icons';

export interface WindowTab {
  label: string;
  active?: boolean;
}

/**
 * A desktop-app window: the traffic-light bar with a title, optional file tabs, and the projected
 * content. `code` is the editor look, `terminal` the dark shell. The dots and tabs are decoration
 * (the tabs are labels, not controls). With `closable` the bar has a real close button that emits
 * `closed`. Put extra buttons (copy) in `[windowActions]`.
 * @level molecule
 */
@Component({
  selector: 'fm-window-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './window-frame.scss',
  imports: [IconButton],
  host: { style: 'display: contents' },
  templateUrl: './window-frame.html',
})
export class WindowFrame {
  readonly variant = input<'code' | 'terminal'>('code');
  readonly title = input<string>();
  readonly tabs = input<readonly WindowTab[]>([]);
  readonly closable = input(false);
  /** The accent glow around the window, for the hero. */
  readonly glow = input(false);
  /** Show the title bar; off for a bare terminal strip (TerminalSignOff). */
  readonly bar = input(true);

  readonly closed = output<void>();

  protected readonly close = iconClose;
  protected readonly closeLabel = computed(() => `Close ${this.title() ?? 'window'}`);
}
