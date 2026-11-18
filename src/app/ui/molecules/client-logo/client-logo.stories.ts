import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { ClientLogo } from './client-logo';

/** A client's logo on its plate: greyscale at rest, colour on hover or focus. */
const meta: Meta<ClientLogo> = {
  title: 'Molecules/ClientLogo',
  component: ClientLogo,
  args: {
    client: {
      name: 'Simple Finance',
      logo: 'clients/simple-finance.png',
      plate: 'light',
      ratio: 3.596,
      website: 'https://simplefinance.ng',
    },
    showName: false,
  },
};
export default meta;

type Story = StoryObj<ClientLogo>;

export const Linked: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Simple Finance' })).toBeVisible();
  },
};

/** White artwork on the dark plate. */
export const DarkPlate: Story = {
  args: { client: { name: 'Mazadat', logo: 'clients/mazadat.svg', plate: 'dark', ratio: 4.45 } },
};

export const WithName: Story = { args: { showName: true } };
