import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Toast } from './toast';

/** A short notice after an action; it closes itself and pauses while hovered or focused. */
const meta: Meta<Toast> = {
  title: 'Molecules/Toast',
  component: Toast,
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger', 'neutral'] },
    variant: { control: 'inline-radio', options: ['dark', 'glass'] },
  },
  args: {
    tone: 'success',
    title: 'Email copied',
    description: 'hello@example.com is on your clipboard.',
    variant: 'dark',
    duration: 0,
    // In the flow, so the stories show the toast in place (the app floats it in the top layer).
    floating: false,
    closed: fn(),
  },
};
export default meta;

type Story = StoryObj<Toast>;

export const Dark: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(args.closed).toHaveBeenCalled();
  },
};

export const Glass: Story = { args: { variant: 'glass' } };

export const WithTimer: Story = { args: { duration: 60000 } };
