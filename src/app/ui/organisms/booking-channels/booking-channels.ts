import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import { Image } from '@ui/atoms';
import { type Channel, ChannelCard, type FramedImage } from '@ui/molecules';

/**
 * "Pick the channel that suits you" (the canvas's BookingChannelsSection, `#book`): a dark band
 * with the photo fading in from the right (on top below 768px), the heading and a line of copy,
 * and four ChannelCards: Schedule a call, email, WhatsApp and a phone call. "Schedule a call"
 * emits `schedule`; the page opens its SchedulerModal.
 * @level organism
 */
@Component({
  selector: 'fm-booking-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // booking-channels* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './booking-channels.scss',
  imports: [ChannelCard, Image],
  host: { style: 'display: contents' },
  templateUrl: './booking-channels.html',
})
export class BookingChannels {
  readonly channels = input.required<readonly Channel[]>();
  readonly photo = input<FramedImage>();
  readonly eyebrow = input('Book');
  readonly title = input('Pick the channel that suits you');
  readonly text = input<string>();
  readonly sectionId = input('book');

  readonly schedule = output<void>();
}
