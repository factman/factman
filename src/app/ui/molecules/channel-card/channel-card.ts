import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { NgTemplateOutlet } from '@angular/common';

import { Icon, type IconDef } from '@ui/atoms';

export interface Channel {
  icon: IconDef | string;
  label: string;
  /** A short line under the label, e.g. "Chat on WhatsApp". */
  meta: string;
  /** Where the channel goes: wa.me, mailto:, tel: … */
  href?: string;
  /** The card opens the scheduler instead of following a link. */
  schedule?: boolean;
}

/**
 * One way to start a conversation, on the dark booking band: WhatsApp, email, phone, or "Schedule
 * a call". A link for the first three (other sites open in a new tab, and say so). With `schedule`
 * it is a button that emits `schedule`; the page opens the scheduler.
 * @level molecule
 */
@Component({
  selector: 'fm-channel-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './channel-card.scss',
  imports: [Icon, NgTemplateOutlet],
  host: { style: 'display: contents' },
  templateUrl: './channel-card.html',
})
export class ChannelCard {
  readonly channel = input.required<Channel>();

  readonly schedule = output<void>();

  protected readonly external = computed(() => /^https?:\/\//.test(this.channel().href ?? ''));
}
