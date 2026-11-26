import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import type { Link } from '@shared';
import { Icon } from '@ui/atoms/icon/icon';
import { iconClock, iconGlobe, iconMail, iconPin, iconWhatsapp } from '@ui/atoms/icon/icons';
import {
  type Availability,
  AvailabilityBadge,
} from '@ui/molecules/availability-badge/availability-badge';
import { ContactMethod } from '@ui/molecules/contact-method/contact-method';
import { PhoneReveal } from '@ui/molecules/phone-reveal/phone-reveal';
import { type FramedImage, PhotoFrame } from '@ui/molecules/photo-frame/photo-frame';
import { SocialLinks } from '@ui/molecules/social-links/social-links';

/** What the column shows, from contact.json and profile.json. */
export interface ContactDetails {
  email: string;
  /** E.164, revealed on request. */
  phone?: string;
  /** wa.me link with the prefilled message. */
  whatsapp?: string;
  /** The company's site, e.g. https://eteam.ng. */
  company?: { label: string; url: string };
  /** City and country only: never a street address (FR-30). */
  city: string;
  country: string;
  /** "within 24 hours". */
  responseTime: string;
  /** "WAT, UTC+1". */
  timezone: string;
  availability: Availability;
  socials: readonly Pick<Link, 'id' | 'label' | 'url'>[];
}

/** "https://www.eteam.ng/" → "eteam.ng". */
export const hostOf = (url: string): string =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

/**
 * The ways to reach Odunayo beside the contact form (FR-29, FR-30, the canvas's ContactSection):
 * the contact photo with a note (availability, reply time), email with copy, the phone number
 * revealed only on request, WhatsApp with a prefilled message, the company and the location
 * (city and country only, never a street address), the social links, and the reply time.
 * @level organism
 */
@Component({
  selector: 'fm-contact-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // contact-channels* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './contact-channels.scss',
  imports: [AvailabilityBadge, ContactMethod, Icon, PhoneReveal, PhotoFrame, SocialLinks],
  host: { style: 'display: contents' },
  templateUrl: './contact-channels.html',
})
export class ContactChannels {
  readonly details = input.required<ContactDetails>();
  readonly photo = input<FramedImage>();

  protected readonly icons = {
    mail: iconMail,
    whatsapp: iconWhatsapp,
    globe: iconGlobe,
    pin: iconPin,
    clock: iconClock,
  };
  protected readonly host = hostOf;
}
