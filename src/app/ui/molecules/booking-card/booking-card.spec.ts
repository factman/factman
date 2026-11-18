import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { BookingCard, type BookingChannel } from './booking-card';

const booking = {
  email: 'mailto:hello@example.com?subject=Quote',
  whatsapp: 'https://wa.me/2347066780373?text=Hi',
  phone: 'tel:+2347066780373',
};

describe('BookingCard', () => {
  it('offers every channel and reports the one chosen', async () => {
    const chosen: BookingChannel[] = [];
    await render(
      `<fm-booking-card service="Consultancy" price="From ₦2,000,000" [booking]="booking" [person]="person" (channel)="chosen.push($event)" />`,
      {
        imports: [BookingCard],
        componentProperties: {
          booking,
          chosen,
          person: { name: 'Odunayo Mohammed', meta: 'Fullstack engineer · Lagos' },
        },
      },
    );
    expect(screen.getByRole('heading', { name: 'Book Consultancy' })).toBeTruthy();
    expect(screen.getByText('From ₦2,000,000')).toBeTruthy();
    expect(screen.getByText('Available for new projects')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Email me/ }).getAttribute('href')).toBe(booking.email);
    expect(screen.getByRole('link', { name: /Call \+234 706 678 0373/ }).getAttribute('href')).toBe(
      booking.phone,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Schedule a call' }));
    for (const link of screen.getAllByRole('link'))
      link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(screen.getByRole('link', { name: /WhatsApp/ }));
    expect(chosen).toEqual(['schedule', 'whatsapp']);
  });
});
