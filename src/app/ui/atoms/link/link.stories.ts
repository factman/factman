import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { Link } from './link';

type Args = Link & { label: string };

/** A text link: router links for app paths, new tab with an arrow for other sites. */
const meta: Meta<Args> = {
  title: 'Atoms/Link',
  component: Link,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: { href: '/projects', label: 'all projects' },
  render: (args) => ({
    props: args,
    template: `<p style="margin: 0; font: 400 16px/1.7 var(--font-sans); color: var(--text-secondary)">
      See <fm-link [href]="href" [newTab]="newTab">{{ label }}</fm-link> for more.</p>`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Internal: Story = {
  play: async ({ canvas }) => {
    // Storybook's router writes an absolute href; the path is what matters.
    const href = canvas.getByRole('link', { name: 'all projects' }).getAttribute('href') ?? '';
    await expect(new URL(href, location.href).pathname).toBe('/projects');
  },
};

export const External: Story = {
  args: { href: 'https://medium.com/@factman60', label: 'my articles on Medium' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /my articles on Medium/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const Email: Story = { args: { href: 'mailto:hi@example.com', label: 'email me' } };

export const KeyboardFocus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'all projects' })).toHaveFocus();
  },
};

export const Dark: Story = {
  args: { href: 'https://medium.com/@factman60', label: 'my articles on Medium' },
  globals: { theme: 'dark' },
};
