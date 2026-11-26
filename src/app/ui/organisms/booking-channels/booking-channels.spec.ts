import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconCalendar, iconMail, iconPhoneCall } from '@ui/atoms/icon/icons';

import { BookingChannels } from './booking-channels';

const channels = [
  { icon: iconCalendar, label: 'Schedule a call', meta: 'Google Calendar', schedule: true },
  { icon: iconMail, label: 'Email', meta: 'hello@example.com', href: 'mailto:hello@example.com' },
  {
    icon: iconPhoneCall,
    label: 'Phone call',
    meta: '+234 706 678 0373',
    href: 'tel:+2347066780373',
  },
];

describe('BookingChannels', () => {
  it('is the #book section, named by its heading, with one card per channel', async () => {
    const { container } = await render(BookingChannels, { inputs: { channels } });
    const region = screen.getByRole('region', { name: 'Pick the channel that suits you' });
    expect(region.id).toBe('book');
    expect(container.querySelectorAll('.booking-channels-cards > li')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Email/ }).getAttribute('href')).toBe(
      'mailto:hello@example.com',
    );
  });

  it('emits schedule from "Schedule a call"', async () => {
    const schedule = vi.fn();
    await render(BookingChannels, { inputs: { channels }, on: { schedule } });
    await userEvent.click(screen.getByRole('button', { name: /Schedule a call/ }));
    expect(schedule).toHaveBeenCalled();
  });

  it('keeps the photo decorative', async () => {
    const { container } = await render(BookingChannels, {
      inputs: { channels, photo: { src: '/a.webp', alt: 'x', width: 900, height: 507 } },
    });
    expect(container.querySelector('.booking-channels-photo img')!.getAttribute('alt')).toBe('');
  });
});
