import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Logo } from './logo';

/** The AY mark and the ODUNAYO lockup, light and dark, from the design system's artwork. */
const meta: Meta<Logo> = {
  title: 'Atoms/Logo',
  component: Logo,
  argTypes: {
    type: { control: 'inline-radio', options: ['mark', 'odunayo'] },
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    size: { control: { type: 'range', min: 16, max: 128, step: 4 } },
  },
  args: { type: 'odunayo', theme: 'light', size: 48, artwork: false },
};
export default meta;

type Story = StoryObj<Logo>;

/** Dark artwork belongs on a dark ground. */
const darkGround = componentWrapperDecorator(
  (story) =>
    `<div data-theme="dark" style="display: inline-flex; padding: var(--padding-lg); background: var(--bg-canvas)">${story}</div>`,
);

export const Lockup: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Odunayo' })).toBeVisible();
  },
};

export const Mark: Story = {
  args: { type: 'mark' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Odunayo Mohammed' })).toBeVisible();
  },
};

export const LockupDark: Story = {
  args: { theme: 'dark' },
  decorators: [darkGround],
};

export const MarkDark: Story = {
  args: { type: 'mark', theme: 'dark' },
  decorators: [darkGround],
};

export const Artwork: Story = {
  args: { artwork: true },
};
