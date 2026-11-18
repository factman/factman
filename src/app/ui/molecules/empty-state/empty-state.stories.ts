import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { iconInbox, iconSearch } from '@ui/atoms';

import { EmptyState } from './empty-state';

/** What shows when a list has nothing in it. */
const meta: Meta<EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  args: {
    icon: iconSearch,
    title: 'No projects match these filters',
    description: 'Try fewer filters, or clear them to see every project.',
    actionLabel: 'Clear filters',
    card: false,
    action: fn(),
  },
};
export default meta;

type Story = StoryObj<EmptyState>;

export const NoResults: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }));
    await expect(args.action).toHaveBeenCalled();
  },
};

export const Card: Story = {
  args: {
    icon: iconInbox,
    title: 'No posts yet',
    description: 'New articles appear here.',
    actionLabel: undefined,
    card: true,
  },
};
