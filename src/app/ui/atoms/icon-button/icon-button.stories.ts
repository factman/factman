import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { iconGithub, iconMenu, iconMoon } from '../icon/icons';
import { IconButton } from './icon-button';

/** A square button with only an icon; its label is its accessible name. */
const meta: Meta<IconButton> = {
  title: 'Atoms/IconButton',
  component: IconButton,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'tertiary', 'text'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { icon: iconMenu, label: 'Open menu', variant: 'secondary', size: 'md', pressed: fn() },
};
export default meta;

type Story = StoryObj<IconButton>;

export const Menu: Story = {
  args: { ariaExpanded: false, ariaControls: 'nav-panel' },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Open menu', expanded: false });
    await userEvent.click(button);
    await expect(args.pressed).toHaveBeenCalledTimes(1);
  },
};

export const ThemeSwitch: Story = {
  args: { icon: iconMoon, label: 'Switch to dark theme', variant: 'tertiary' },
};

/** Small icon buttons still have a 44 × 44px hit area. */
export const Small: Story = {
  args: { size: 'sm' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Open menu' });
    const hit = getComputedStyle(button, '::before');
    await expect(hit.position).toBe('absolute');
    await expect(button.getBoundingClientRect().height).toBe(32);
  },
};

export const AsLink: Story = {
  args: { icon: iconGithub, label: 'GitHub', href: 'https://github.com/factman' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /GitHub/ })).toHaveAttribute('target', '_blank');
  },
};

export const Dark: Story = { globals: { theme: 'dark' } };
