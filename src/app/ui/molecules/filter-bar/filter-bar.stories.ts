import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { FilterBar } from './filter-bar';

/** The projects list's filters: toggle chips, search, sort and "Clear filters". */
const meta: Meta<FilterBar> = {
  title: 'Molecules/FilterBar',
  component: FilterBar,
  args: {
    label: 'Filter by type',
    options: [
      { value: 'web', label: 'Web', count: 12 },
      { value: 'mobile', label: 'Mobile', count: 4 },
      { value: 'fintech', label: 'Fintech', count: 6 },
      { value: 'devops', label: 'DevOps', count: 3 },
    ],
    selected: [],
    filterChange: fn(),
  },
};
export default meta;

type Story = StoryObj<FilterBar>;

export const Chips: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Fintech/ }));
    await expect(args.filterChange).toHaveBeenCalledWith({
      selected: ['fintech'],
      query: '',
      sort: undefined,
    });
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  },
};

export const WithSearchAndSort: Story = {
  args: {
    selected: ['web'],
    searchLabel: 'Search projects',
    sortOptions: [
      { value: 'new', label: 'Newest first' },
      { value: 'old', label: 'Oldest first' },
    ],
    sort: 'new',
  },
};
