import { contact } from '@data/contact';
import { profile } from '@data/profile';
import { type AnalyticsEvent, type BookingChannel, formatPhone } from '@shared';
import { iconCalendar, iconMail, iconPhoneCall, iconWhatsapp } from '@ui/atoms';
import type { BookingPerson, Channel } from '@ui/molecules';

/** service_enquiry for the Services page's general channels (no one service). */
const enquiry = (channel: BookingChannel): AnalyticsEvent => ({
  name: 'service_enquiry',
  params: { service_id: 'general', channel },
});

/** The general booking channels (the Services page's "Pick the channel that suits you"). */
export function bookingChannels(): Channel[] {
  const subject = encodeURIComponent('Quote request');
  const body = encodeURIComponent(
    "Hi Odunayo,\n\nI'd like a quote for:\n\nAbout my project:\n- What I'm building:\n- Timeline:\n- Budget range (optional):\n\nThanks,\n",
  );
  return [
    {
      icon: iconCalendar,
      label: 'Schedule a call',
      meta: 'Google Calendar · pick a slot',
      schedule: true,
      track: enquiry('scheduler'),
    },
    {
      icon: iconMail,
      label: 'Email',
      meta: contact.email,
      href: `mailto:${contact.email}?subject=${subject}&body=${body}`,
      track: enquiry('email'),
    },
    {
      icon: iconWhatsapp,
      label: 'WhatsApp',
      meta: formatPhone(contact.phone),
      href: `https://wa.me/${contact.whatsapp.number}?text=${encodeURIComponent(contact.whatsapp.message)}`,
      track: enquiry('whatsapp'),
    },
    {
      icon: iconPhoneCall,
      label: 'Phone call',
      meta: formatPhone(contact.phone),
      href: `tel:${contact.phone}`,
      track: enquiry('phone'),
    },
  ];
}

/** Who you'll talk to, on a service's BookingCard. */
export const bookingPerson = (): BookingPerson => ({
  name: profile.name,
  photo: '/assets/profile/odunayo-hero-360.webp',
  // contact.json's time zone (Africa/Lagos) as people say it.
  meta: `${profile.headline} · ${contact.city}, WAT (UTC+1)`,
});
