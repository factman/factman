import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconCalendar, iconGithub, iconMail } from '@ui/atoms/icon/icons';

import { CtaBanner } from './cta-banner';

/** A closing call to action on a glass panel, with an optional cutout portrait (not on phones). */
const meta: Meta<CtaBanner> = {
  title: 'Organisms/CtaBanner',
  component: CtaBanner,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'padded' },
  args: {
    title: 'Not sure which service fits?',
    text: "Tell me what you're building and I'll suggest where to start, usually on a short call.",
    actions: [
      {
        label: 'Schedule a call',
        href: 'https://calendar.app.google/example',
        trailingIcon: iconCalendar,
      },
      { label: 'Email me', href: 'mailto:hello@example.com', leadingIcon: iconMail },
    ],
  },
};
export default meta;

type Story = StoryObj<CtaBanner>;

export const Text: Story = {
  /** The heading and both actions, in order, reachable with Tab. */
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: /Not sure which service fits/ }),
    ).toBeVisible();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: /Schedule a call/ })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: /Email me/ })).toHaveFocus();
  },
};

/** With the cutout portrait (the project pages' "Building something similar?"). */
export const WithPhoto: Story = {
  args: {
    title: 'Building something similar?',
    text: 'Tell me what you have in mind and I will tell you how I would approach it.',
    actions: [
      { label: 'Book a service', href: '/services' },
      { label: 'GitHub', href: 'https://github.com/factman', leadingIcon: iconGithub },
    ],
    photo: { src: '/assets/profile/odunayo-about.webp', alt: '', width: 720, height: 900 },
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
