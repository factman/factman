import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { type Theme, ThemeToggle } from './theme-toggle';

/** Switches Light and Dark. In the app the page passes `themeChange` to ThemeService. */
const meta: Meta<ThemeToggle> = {
  title: 'Molecules/ThemeToggle',
  component: ThemeToggle,
  args: { showLabel: false },
  render: (args) => {
    const theme = signal<Theme>('light');
    return {
      props: { ...args, theme, set: (t: Theme) => theme.set(t) },
      template: `<fm-theme-toggle [theme]="theme()" [showLabel]="showLabel" (themeChange)="set($event)" />`,
    };
  },
};
export default meta;

type Story = StoryObj<ThemeToggle>;

export const IconOnly: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dark theme', pressed: false }));
    await expect(canvas.getByRole('button', { name: 'Dark theme', pressed: true })).toBeVisible();
  },
};

export const WithLabel: Story = { args: { showLabel: true } };
