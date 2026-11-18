import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Breadcrumbs } from './breadcrumbs';

/** Where a page sits in the site; the last crumb is the current page. */
const meta: Meta<Breadcrumbs> = {
  title: 'Molecules/Breadcrumbs',
  component: Breadcrumbs,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    crumbs: [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'Investa' },
    ],
  },
};
export default meta;

export const Trail: StoryObj<Breadcrumbs> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Investa')).toHaveAttribute('aria-current', 'page');
  },
};
