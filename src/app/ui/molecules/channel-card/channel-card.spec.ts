import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconCalendar, iconWhatsapp } from '@ui/atoms/icon/icons';

import { ChannelCard } from './channel-card';

describe('ChannelCard', () => {
  it('is a link to another site in a new tab', async () => {
    await render(ChannelCard, {
      inputs: {
        channel: {
          icon: iconWhatsapp,
          label: 'WhatsApp',
          meta: 'Chat on WhatsApp',
          href: 'https://wa.me/2347066780373',
        },
      },
    });
    const link = screen.getByRole('link', { name: /WhatsApp.*opens in a new tab/ });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('is a dialog button that emits schedule', async () => {
    const schedule = vi.fn();
    await render(`<fm-channel-card [channel]="channel" (schedule)="schedule()" />`, {
      imports: [ChannelCard],
      componentProperties: {
        schedule,
        channel: {
          icon: iconCalendar,
          label: 'Schedule a call',
          meta: '30 minutes',
          schedule: true,
        },
      },
    });
    const button = screen.getByRole('button', { name: /Schedule a call/ });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    await userEvent.click(button);
    expect(schedule).toHaveBeenCalledOnce();
  });
});
