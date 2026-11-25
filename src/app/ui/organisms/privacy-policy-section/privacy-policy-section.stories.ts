import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';

import { PrivacyPolicySection } from './privacy-policy-section';

/** The privacy policy: what is collected, the cookie table, the contact form and who to ask. */
const meta: Meta<PrivacyPolicySection> = {
  title: 'Organisms/PrivacyPolicySection',
  component: PrivacyPolicySection,
  parameters: { layout: 'padded' },
  args: {
    email: 'hello@example.com',
    analytics: 'unset',
    changeSettings: fn(),
    storage: [
      {
        name: 'fm_consent',
        category: 'Necessary',
        purpose: 'Stores your cookie choice',
        lifetime: '6 months',
      },
      {
        name: 'fm_theme',
        category: 'Necessary',
        purpose: 'Remembers Light or Dark',
        lifetime: 'Until cleared',
      },
      {
        name: '_ga',
        category: 'Analytics',
        purpose: 'Distinguishes visitors (GA4)',
        lifetime: '14 months',
      },
    ],
  },
};
export default meta;

type Story = StoryObj<PrivacyPolicySection>;

export const Default: Story = {
  /** The cookie table, and "Change cookie settings" from the keyboard. */
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('table', { name: /Cookies and browser storage/ })).toBeVisible();
    canvas.getByRole('button', { name: /Change cookie settings/ }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.changeSettings).toHaveBeenCalled();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
