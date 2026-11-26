import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconClock, iconGlobe, iconMail } from '@ui/atoms/icon/icons';

import { List } from './list';

/** Rows of short facts or links. */
const meta: Meta<List> = {
  title: 'Molecules/List',
  component: List,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'inset'] } },
  args: {
    variant: 'inset',
    items: [
      { title: 'Based in', value: 'Lagos, Nigeria', icon: iconGlobe },
      { title: 'Replies', value: 'Within 24 hours', icon: iconClock },
      {
        title: 'Résumé',
        description: 'Web, mobile and DevOps versions',
        icon: iconMail,
        href: '/resume',
      },
    ],
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px"><fm-list [items]="items" [variant]="variant" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<List>;

export const Inset: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: /Résumé/ });
    // The story's router renders an absolute href; compare the path.
    await expect(new URL(link.getAttribute('href') ?? '', location.href).pathname).toBe('/resume');
  },
};

export const Plain: Story = { args: { variant: 'plain' } };
