import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { iconArrowRight, iconDownload, iconLayout, iconMail } from '../icon/icons';
import { Button } from './button';

type Args = Button & { label: string };

/** The design system's button: variants, sizes, icons, loading, disabled, toggles and links. */
const meta: Meta<Args> = {
  title: 'Atoms/Button',
  component: Button,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'text', 'link'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { label: 'Book a service', variant: 'primary', size: 'lg', pressed: fn() },
  render: (args) => ({
    props: args,
    template: `<fm-button [variant]="variant" [size]="size" [href]="href" [leadingIcon]="leadingIcon"
      [trailingIcon]="trailingIcon" [loading]="loading" [disabled]="disabled" [toggled]="toggled"
      [full]="full" (pressed)="pressed($event)">{{ label }}</fm-button>`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Primary: Story = {
  args: { trailingIcon: iconArrowRight },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Book a service' }));
    await expect(args.pressed).toHaveBeenCalledTimes(1);
  },
};

export const Secondary: Story = {
  args: { variant: 'secondary', label: 'View projects', leadingIcon: iconLayout },
};

export const Tertiary: Story = {
  args: { variant: 'tertiary', label: 'Résumé', leadingIcon: iconDownload },
};

export const Text: Story = { args: { variant: 'text', size: 'md', label: 'Edit message' } };

export const LinkStyle: Story = {
  args: { variant: 'link', size: 'md', label: 'Mobile Developer' },
};

/** sm 32, md 40, lg 48, xl 56. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <span style="display: inline-flex; flex-wrap: wrap; gap: var(--gap-sm); align-items: center">
        <fm-button size="sm">Small 32</fm-button><fm-button size="md">Medium 40</fm-button>
        <fm-button size="lg">Large 48</fm-button><fm-button size="xl">XLarge 56</fm-button>
      </span>`,
  }),
};

export const Loading: Story = {
  args: { loading: true, label: 'Saving', leadingIcon: iconMail },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Saving' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    // Busy, not disabled: it stays focusable, and a press does nothing (ETE-250).
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.pressed).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { variant: 'secondary', disabled: true, label: 'Disabled' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  },
};

export const Toggled: Story = {
  args: { variant: 'tertiary', size: 'md', toggled: true, label: 'Fullstack' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { pressed: true })).toBeVisible();
  },
};

/** A path in this app: a router link that looks like a button. */
export const AppLink: Story = {
  args: {
    href: '/projects',
    variant: 'secondary',
    label: 'View projects',
    leadingIcon: iconLayout,
  },
  play: async ({ canvas }) => {
    // Storybook's router writes an absolute href; the path is what matters.
    const href = canvas.getByRole('link', { name: 'View projects' }).getAttribute('href') ?? '';
    await expect(new URL(href, location.href).pathname).toBe('/projects');
  },
};

/** Another site: opens in a new tab, with a note for screen readers. */
export const ExternalLink: Story = {
  args: { href: 'https://medium.com/@factman60', variant: 'secondary', label: 'Follow on Medium' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /Follow on Medium/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

/** The focus ring shows on keyboard focus only, in Light and Dark. */
export const KeyboardFocus: Story = {
  args: { variant: 'secondary', label: 'Focus me' },
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Focus me' })).toHaveFocus();
  },
};

export const KeyboardFocusDark: Story = {
  ...KeyboardFocus,
  globals: { theme: 'dark' },
};

/** Every variant on a dark ground. */
export const AllVariantsDark: Story = {
  globals: { theme: 'dark' },
  render: () => ({
    template: `
      <span style="display: inline-flex; flex-wrap: wrap; gap: var(--gap-sm); align-items: center">
        <fm-button>Primary</fm-button><fm-button variant="secondary">Secondary</fm-button>
        <fm-button variant="tertiary">Tertiary</fm-button><fm-button variant="text">Text</fm-button>
        <fm-button variant="link">Link</fm-button><fm-button [disabled]="true">Disabled</fm-button>
      </span>`,
  }),
};
