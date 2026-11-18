import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { StatCounter } from './stat-counter';

/** A big number that counts up once when it scrolls into view. */
const meta: Meta<StatCounter> = {
  title: 'Molecules/StatCounter',
  component: StatCounter,
  args: { value: 12, suffix: '+', label: 'years building software', framed: false },
};
export default meta;

type Story = StoryObj<StatCounter>;

export const Plain: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('12+ years building software')).toBeInTheDocument();
  },
};

export const Framed: Story = {
  args: { framed: true, value: 40, suffix: '', label: 'projects shipped' },
};
