import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { SocialLinks } from './social-links';

/** Links to Odunayo's profiles elsewhere; the page passes contact.json's `links`. */
const meta: Meta<SocialLinks> = {
  title: 'Molecules/SocialLinks',
  component: SocialLinks,
  argTypes: { variant: { control: 'inline-radio', options: ['icon', 'pill'] } },
  args: {
    variant: 'icon',
    links: [
      { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mohammed-odunayo' },
      { id: 'github', label: 'GitHub', url: 'https://github.com/factman' },
      { id: 'x', label: 'X', url: 'https://x.com/MohammedFactman' },
      { id: 'medium', label: 'Medium', url: 'https://medium.com/@factman60' },
      { id: 'eteam', label: 'ETeam Technology', url: 'https://eteam.ng' },
    ],
  },
};
export default meta;

type Story = StoryObj<SocialLinks>;

export const Icons: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'GitHub (opens in a new tab)' })).toHaveAttribute(
      'target',
      '_blank',
    );
  },
};

export const Pills: Story = { args: { variant: 'pill' } };
