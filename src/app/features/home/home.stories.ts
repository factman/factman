import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Home } from './home';

/** Smoke story: renders the home page shell and runs axe on it. */
const meta: Meta<Home> = {
  title: 'Pages/Home',
  component: Home,
};
export default meta;

type Story = StoryObj<Home>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeVisible();
  },
};
