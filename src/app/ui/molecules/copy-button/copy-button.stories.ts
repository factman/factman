import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { CopyButton } from './copy-button';

/** Copies a value and confirms it in a polite live region. */
const meta: Meta<CopyButton> = {
  title: 'Molecules/CopyButton',
  component: CopyButton,
  args: { value: 'hello@example.com', label: 'Copy email', copied: fn() },
  // The test browser doesn't grant clipboard access; give the stories a clipboard that works.
  beforeEach: () => {
    const real = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => undefined },
      configurable: true,
    });
    return () => {
      delete (navigator as { clipboard?: unknown }).clipboard;
      if (real) Object.defineProperty(Navigator.prototype, 'clipboard', real);
    };
  },
};
export default meta;

type Story = StoryObj<CopyButton>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy email' }));
    await expect(await canvas.findByRole('status')).toHaveTextContent(/hello@example.com/);
    await expect(args.copied).toHaveBeenCalledWith('hello@example.com');
  },
};

export const Primary: Story = { args: { variant: 'primary', size: 'md' } };
