import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { provideIcons } from '@ui/atoms/icon/icon-registry';
import { iconLightbulb } from '@ui/atoms/icon/icons';

import { ServiceCard } from './service-card';

/** A service offered: a card with "Get a quote", or with `href` a linked tile (ServiceTile). */
const meta: Meta<ServiceCard> = {
  title: 'Molecules/ServiceCard',
  component: ServiceCard,
  decorators: [
    applicationConfig({ providers: [provideRouter([]), provideIcons([iconLightbulb])] }),
  ],
  args: {
    service: {
      slug: 'consultancy',
      title: 'Consultancy',
      summary:
        'Independent advice on architecture, product and technology choices before you commit budget.',
      icon: 'lightbulb',
      deliverables: [
        'Technical discovery and current-state review',
        'Architecture and technology recommendations',
        'Build, buy or partner assessment',
        'A prioritised roadmap',
      ],
    },
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 360px"><fm-service-card [service]="service" [href]="href" [current]="current" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<ServiceCard>;

export const Card: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /Get a quote/ })).toBeVisible();
  },
};

export const Tile: Story = { args: { href: '/services/consultancy' } };

export const Current: Story = { args: { href: '/services/consultancy', current: true } };
