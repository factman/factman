import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Caret } from './caret';

/** A blinking text cursor; steady with reduced motion. */
const meta: Meta<Caret> = {
  title: 'Atoms/Caret',
  component: Caret,
  argTypes: { shape: { control: 'inline-radio', options: ['bar', 'block'] } },
  args: { shape: 'bar' },
  render: (args) => ({
    props: args,
    template: `<span style="font: 500 20px/1.4 var(--font-mono); color: var(--text-primary)">npm run dev<fm-caret [shape]="shape" /></span>`,
  }),
};
export default meta;

type Story = StoryObj<Caret>;

export const Bar: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.fm-caret')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Block: Story = { args: { shape: 'block' } };
