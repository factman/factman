import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { NavLink } from './nav-link';

/** One item of the site navigation; the active one carries `aria-current`. */
const meta: Meta<NavLink> = {
  title: 'Atoms/NavLink',
  component: NavLink,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: { size: 'md', variant: 'pill' },
  render: (args) => ({
    props: args,
    template: `<nav aria-label="Example" style="display: flex; gap: 4px">
      <fm-nav-link href="/#about" label="About" [size]="size" [variant]="variant" />
      <fm-nav-link href="/services" label="Services" [active]="true" [size]="size" [variant]="variant" />
      <fm-nav-link href="/projects" label="Projects" [size]="size" [variant]="variant" />
    </nav>`,
  }),
};
export default meta;

type Story = StoryObj<NavLink>;

export const Pill: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Services' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current');
  },
};

export const Small: Story = { args: { size: 'sm' } };

export const Underline: Story = { args: { variant: 'underline' } };
