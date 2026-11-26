import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Icon } from '@ui/atoms/icon/icon';
import { iconHeart } from '@ui/atoms/icon/icons';

import { WindowFrame } from '../window-frame/window-frame';

/**
 * The footer's sign-off as a one-line terminal: `$ echo "Built with love by Factman"` and its
 * output with a beating heart (read as "love"). The heartbeat stops with reduced motion.
 * @level molecule
 */
@Component({
  selector: 'fm-terminal-sign-off',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './terminal-sign-off.scss',
  imports: [Icon, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './terminal-sign-off.html',
})
export class TerminalSignOff {
  readonly command = input('echo "Built with love by Factman"');
  readonly signature = input('Factman');

  protected readonly heart = iconHeart;
}
