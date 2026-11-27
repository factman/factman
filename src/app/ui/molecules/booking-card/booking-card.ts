import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import type { Service } from '@shared';
import { Avatar } from '@ui/atoms/avatar/avatar';
import { Button } from '@ui/atoms/button/button';
import { Divider } from '@ui/atoms/divider/divider';
import { iconArrowRight, iconMail, iconPhoneCall, iconWhatsapp } from '@ui/atoms/icon/icons';

import { AvailabilityBadge } from '../availability-badge/availability-badge';
import { formatPhone } from '../phone-reveal/phone';
import { ScheduleCallButton } from '../schedule-call-button/schedule-call-button';

/** How the visitor chose to get in touch, for the page to record (and, for `schedule`, act on). */
export type BookingChannel = 'schedule' | 'email' | 'whatsapp' | 'phone';

export interface BookingPerson {
  name: string;
  photo?: string;
  /** "Fullstack engineer · Lagos, WAT (UTC+1)". */
  meta: string;
}

/**
 * The service page's booking card: who you'll talk to, availability, the service and its price,
 * then the ways to start: schedule a call (the page opens the scheduler), email and WhatsApp
 * (prefilled with the service), phone, or a detailed brief. Every choice emits `channel`.
 * @level molecule
 */
@Component({
  selector: 'fm-booking-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './booking-card.scss',
  imports: [AvailabilityBadge, Avatar, Button, Divider, ScheduleCallButton],
  host: { style: 'display: contents' },
  templateUrl: './booking-card.html',
})
export class BookingCard {
  /** The service's name. */
  readonly service = input.required<string>();
  /** "From ₦2,000,000", or "Get a quote". */
  readonly price = input('Get a quote');
  readonly booking = input.required<Pick<Service['booking'], 'email' | 'whatsapp' | 'phone'>>();
  readonly person = input.required<BookingPerson>();
  readonly briefHref = input('/#contact');

  readonly channel = output<BookingChannel>();

  protected readonly mail = iconMail;
  protected readonly whatsapp = iconWhatsapp;
  protected readonly phoneCall = iconPhoneCall;
  protected readonly arrow = iconArrowRight;
  protected readonly phoneLabel = computed(
    () => `Call ${formatPhone(this.booking().phone.replace(/^tel:/, ''))}`,
  );
}
