import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Spinner } from './spinner';

/** A loading indicator that reads its label to assistive tech. */
const meta: Meta<Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  argTypes: {
    type: { control: 'inline-radio', options: ['ring', 'logo'] },
    tone: { control: 'inline-radio', options: ['default', 'subtle', 'inverse', 'current'] },
  },
  args: { type: 'ring', size: 24, tone: 'default', label: 'Loading' },
};
export default meta;

type Story = StoryObj<Spinner>;

export const Ring: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading');
  },
};

export const Logo: Story = { args: { type: 'logo', size: 64, label: 'Loading page' } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <span style="display: inline-flex; gap: var(--gap-md); align-items: center">
        <fm-spinner [size]="16" /><fm-spinner [size]="24" /><fm-spinner [size]="32" /><fm-spinner [size]="48" />
      </span>`,
  }),
};
