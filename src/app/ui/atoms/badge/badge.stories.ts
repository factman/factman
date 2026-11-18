import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Badge } from './badge';

/** A small count or dot pinned to another element. */
const meta: Meta<Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    tone: { control: 'inline-radio', options: ['danger', 'neutral', 'success', 'inverse'] },
  },
  args: { count: 3, max: 99, size: 'sm', tone: 'danger', label: '3 unread messages' },
};
export default meta;

type Story = StoryObj<Badge>;

export const Count: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3 unread messages')).toBeInTheDocument();
  },
};

export const Overflow: Story = {
  args: { count: 120, label: '120 notifications' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('99+')).toBeInTheDocument();
  },
};

export const Dot: Story = { args: { count: undefined, label: 'New activity' } };

export const Tones: Story = {
  render: (args) => ({
    props: args,
    template: `
      <span style="display: inline-flex; gap: var(--gap-md); align-items: center">
        <fm-badge [count]="4" tone="danger" size="md" />
        <fm-badge [count]="4" tone="neutral" size="md" />
        <fm-badge [count]="4" tone="success" size="md" />
        <fm-badge [count]="4" tone="inverse" size="md" />
      </span>`,
  }),
};
