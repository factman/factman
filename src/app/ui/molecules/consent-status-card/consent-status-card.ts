import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { Button } from '@ui/atoms/button/button';
import { iconSettings } from '@ui/atoms/icon/icons';

import { WindowFrame } from '../window-frame/window-frame';

export type ConsentChoice = 'granted' | 'denied' | 'unset';

const ANALYTICS: Record<ConsentChoice, string> = {
  granted: 'on',
  denied: 'off',
  unset: 'not decided',
};

/**
 * The privacy page's cookie status as a terminal printout (`./consent --status`): necessary on,
 * analytics as the visitor chose, advertising never used. "Change cookie settings" emits
 * `changeSettings`;
 * the page reopens the consent banner (it owns consent, in core).
 * @level molecule
 */
@Component({
  selector: 'fm-consent-status-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './consent-status-card.scss',
  imports: [Button, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './consent-status-card.html',
})
export class ConsentStatusCard {
  readonly analytics = input<ConsentChoice>('unset');

  /** The visitor wants to change their choice (not `change`, which is a DOM event). */
  readonly changeSettings = output<void>();

  protected readonly settings = iconSettings;
  protected readonly state = computed(() => ANALYTICS[this.analytics()]);
}
