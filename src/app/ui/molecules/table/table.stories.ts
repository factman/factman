import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Table } from './table';

/** A data table, such as the privacy page's cookies. */
const meta: Meta<Table> = {
  title: 'Molecules/Table',
  component: Table,
  argTypes: { density: { control: 'inline-radio', options: ['comfortable', 'compact'] } },
  args: {
    caption: 'Cookies this site uses',
    density: 'comfortable',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'type', label: 'Type' },
      { key: 'days', label: 'Expires (days)', align: 'end' },
    ],
    rows: [
      { name: 'fm-consent', purpose: 'Remembers your cookie choice', type: 'Necessary', days: 365 },
      { name: 'fm-theme', purpose: 'Remembers Light or Dark', type: 'Necessary', days: 365 },
      {
        name: '_ga',
        purpose: 'Counts visits, only with your consent',
        type: 'Analytics',
        days: 400,
      },
    ],
  },
};
export default meta;

type Story = StoryObj<Table>;

export const Cookies: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table', { name: 'Cookies this site uses' })).toBeVisible();
  },
};

export const Compact: Story = { args: { density: 'compact' } };
