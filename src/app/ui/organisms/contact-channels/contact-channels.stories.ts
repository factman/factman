import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { ContactChannels } from './contact-channels';

/**
 * The ways to reach Odunayo beside the contact form: the photo and its note, email, the phone
 * revealed on request, WhatsApp, the company, the location (city and country only), socials and
 * the reply time.
 */
const meta: Meta<ContactChannels> = {
  title: 'Organisms/ContactChannels',
  component: ContactChannels,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'padded' },
  args: {
    details: {
      email: 'hello@example.com',
      phone: '+2347066780373',
      whatsapp: 'https://wa.me/2347066780373?text=Hi',
      company: { label: 'ETeam Technology', url: 'https://eteam.ng' },
      city: 'Lagos',
      country: 'Nigeria',
      responseTime: 'within 24 hours',
      timezone: 'WAT, UTC+1',
      availability: 'available',
      socials: [
        { id: 'github', label: 'GitHub', url: 'https://github.com/factman' },
        { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mohammed-odunayo' },
      ],
    },
    photo: {
      src: '/assets/profile/odunayo-contact.webp',
      alt: 'Odunayo Mohammed smiling and pointing toward the contact form',
      width: 900,
      height: 507,
    },
  },
};
export default meta;

type Story = StoryObj<ContactChannels>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Lagos, Nigeria')).toBeVisible();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
