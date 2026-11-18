import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { TerminalSignOff } from './terminal-sign-off';

/** The footer's sign-off as a one-line terminal; the heart stops with reduced motion. */
const meta: Meta<TerminalSignOff> = {
  title: 'Molecules/TerminalSignOff',
  component: TerminalSignOff,
  render: () => ({ template: `<div style="max-width: 520px"><fm-terminal-sign-off /></div>` }),
};
export default meta;

export const Default: StoryObj<TerminalSignOff> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'love' })).toBeVisible();
  },
};
