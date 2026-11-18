import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { AvailabilityBadge } from './availability-badge';

/** Whether Odunayo is taking new work. */
const meta: Meta<AvailabilityBadge> = {
  title: 'Molecules/AvailabilityBadge',
  component: AvailabilityBadge,
  argTypes: { status: { control: 'inline-radio', options: ['available', 'busy'] } },
  args: { status: 'available', label: 'Available for new projects' },
};
export default meta;

type Story = StoryObj<AvailabilityBadge>;

export const Available: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Available for new projects')).toBeVisible();
  },
};

export const Busy: Story = { args: { status: 'busy', label: undefined } };
