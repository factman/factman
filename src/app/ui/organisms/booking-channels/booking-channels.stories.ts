import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconCalendar, iconMail, iconPhoneCall, iconWhatsapp } from '@ui/atoms/icon/icons';

import { BookingChannels } from './booking-channels';

/**
 * "Pick the channel that suits you": the dark booking band with the photo fading in, and the four
 * channels. "Schedule a call" emits `schedule` for the page's SchedulerModal.
 */
const meta: Meta<BookingChannels> = {
  title: 'Organisms/BookingChannels',
  component: BookingChannels,
  parameters: { layout: 'fullscreen' },
  args: {
    text: 'Every service is quoted after a short call. Book a slot on my calendar, or open a service page and the email and WhatsApp messages name that service for you.',
    channels: [
      {
        icon: iconCalendar,
        label: 'Schedule a call',
        meta: 'Google Calendar · pick a slot',
        schedule: true,
      },
      {
        icon: iconMail,
        label: 'Email',
        meta: 'hello@example.com',
        href: 'mailto:hello@example.com',
      },
      {
        icon: iconWhatsapp,
        label: 'WhatsApp',
        meta: '+234 706 678 0373',
        href: 'https://wa.me/2347066780373',
      },
      {
        icon: iconPhoneCall,
        label: 'Phone call',
        meta: '+234 706 678 0373',
        href: 'tel:+2347066780373',
      },
    ],
    photo: {
      src: '/assets/profile/odunayo-contact.webp',
      alt: '',
      width: 900,
      height: 507,
      sources: {
        avif: '/assets/profile/odunayo-contact-450.avif 450w, /assets/profile/odunayo-contact-676.avif 676w, /assets/profile/odunayo-contact-900.avif 900w',
        webp: '/assets/profile/odunayo-contact-450.webp 450w, /assets/profile/odunayo-contact-676.webp 676w, /assets/profile/odunayo-contact-900.webp 900w',
      },
      sizes: '640px',
    },
  },
};
export default meta;

type Story = StoryObj<BookingChannels>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2 })).toBeVisible();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
