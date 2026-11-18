import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { AvatarLabel } from './avatar-label';

/** A person with a line about them. */
const meta: Meta<AvatarLabel> = {
  title: 'Molecules/AvatarLabel',
  component: AvatarLabel,
  args: {
    title: 'Odunayo Mohammed',
    description: 'CTO, Simple Finance',
    avatar: '/assets/profile/odunayo-hero-360.webp',
    size: 'md',
  },
};
export default meta;

type Story = StoryObj<AvatarLabel>;

export const Photo: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CTO, Simple Finance')).toBeVisible();
  },
};

export const Initials: Story = {
  args: { avatar: undefined, title: 'ETeam Technology', description: 'Co-founder' },
};
