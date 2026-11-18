import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { BookingCard } from './booking-card';

/** The service page's booking card; every choice emits `channel`. */
const meta: Meta<BookingCard> = {
  title: 'Molecules/BookingCard',
  component: BookingCard,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    service: 'Technical leadership',
    price: 'Get a quote',
    booking: {
      email: 'mailto:factman60@gmail.com?subject=Quote%20request%3A%20Technical%20leadership',
      whatsapp: 'https://wa.me/2347066780373?text=Hi%20Odunayo',
      phone: 'tel:+2347066780373',
    },
    person: {
      name: 'Odunayo Mohammed',
      photo: '/assets/profile/odunayo-hero-360.webp',
      meta: 'Fullstack engineer · Lagos, WAT (UTC+1)',
    },
    channel: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-booking-card [service]="service" [price]="price" [booking]="booking" [person]="person" (channel)="channel($event)" /></div>`,
  }),
};
export default meta;

export const Booking: StoryObj<BookingCard> = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Schedule a call' }));
    await expect(args.channel).toHaveBeenCalledWith('schedule');
  },
};
