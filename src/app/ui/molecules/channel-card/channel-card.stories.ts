import { type Meta, type StoryObj, componentWrapperDecorator } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconCalendar, iconMail, iconWhatsapp } from '@ui/atoms';

import { ChannelCard } from './channel-card';

/** One way to start a conversation, on the dark booking band. */
const meta: Meta<ChannelCard> = {
  title: 'Molecules/ChannelCard',
  component: ChannelCard,
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="max-width: 280px; padding: var(--padding-lg); border-radius: var(--radius-lg); background: var(--bg-inverse)">${story}</div>`,
    ),
  ],
  args: {
    channel: {
      icon: iconWhatsapp,
      label: 'WhatsApp',
      meta: 'Chat on WhatsApp',
      href: 'https://wa.me/2347066780373',
    },
  },
};
export default meta;

type Story = StoryObj<ChannelCard>;

export const Link: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'target',
      '_blank',
    );
  },
};

export const Email: Story = {
  args: {
    channel: {
      icon: iconMail,
      label: 'Email',
      meta: 'factman60@gmail.com',
      href: 'mailto:factman60@gmail.com',
    },
  },
};

export const Schedule: Story = {
  args: {
    channel: {
      icon: iconCalendar,
      label: 'Schedule a call',
      meta: '30 minutes, Google Meet',
      schedule: true,
    },
  },
};
