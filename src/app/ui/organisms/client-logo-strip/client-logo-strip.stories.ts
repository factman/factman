import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { ClientLogoStrip, type StripClient } from './client-logo-strip';

const CLIENTS: StripClient[] = [
  {
    id: 1,
    name: 'Simple Finance',
    logo: 'clients/simple-finance.png',
    plate: 'light',
    ratio: 3.596,
    website: 'https://simplefinance.ng',
  },
  {
    id: 2,
    name: 'ETeam Technology',
    logo: 'clients/eteam-technology.png',
    plate: 'light',
    ratio: 1.074,
    website: 'https://eteam.ng',
  },
  {
    id: 3,
    name: 'Mazadat',
    logo: 'clients/mazadat.svg',
    plate: 'dark',
    ratio: 4.45,
    website: 'https://www.mazad.at',
  },
  {
    id: 4,
    name: 'Travoofy',
    logo: 'clients/travoofy.png',
    plate: 'light',
    ratio: 3.42,
    website: 'https://travoofy.com',
  },
  {
    id: 10,
    name: 'Internopay',
    logo: 'clients/internopay.png',
    plate: 'dark',
    ratio: 5.325,
    website: 'https://www.internopay.com',
  },
  {
    id: 12,
    name: 'SunTrust Bank',
    logo: 'clients/suntrust-bank.png',
    plate: 'light',
    ratio: 1.084,
    website: 'https://suntrustng.com',
  },
];

/**
 * "Worked with": client and company logos in an endless marquee that pauses on hover, on focus
 * and with its button. Under reduced motion it is a static, centred grid. With no clients it
 * renders nothing.
 */
const meta: Meta<ClientLogoStrip> = {
  title: 'Organisms/ClientLogoStrip',
  component: ClientLogoStrip,
  parameters: { layout: 'fullscreen' },
  args: { clients: CLIENTS },
};
export default meta;

type Story = StoryObj<ClientLogoStrip>;

export const Marquee: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Worked with' })).toBeVisible();
    // Each client once for assistive technology; the copy is hidden.
    await expect(canvas.getAllByRole('listitem')).toHaveLength(CLIENTS.length);
    const pause = canvas.getByRole('button', { name: 'Pause the logo animation' });
    await userEvent.click(pause);
    await expect(canvas.getByRole('button', { name: 'Play the logo animation' })).toBeVisible();
  },
};

/** No clients: the strip is omitted (FR-52). */
export const Empty: Story = {
  args: { clients: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region')).toBeNull();
  },
};
