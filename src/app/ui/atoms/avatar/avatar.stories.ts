import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Avatar, AVATAR_SIZES } from './avatar';

const PHOTO = '/assets/profile/odunayo-hero-360.webp';

/** A round photo of a person, or their initials when there is no photo. */
const meta: Meta<Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  argTypes: {
    size: { control: 'inline-radio', options: Object.keys(AVATAR_SIZES) },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
  },
  args: { name: 'Odunayo Mohammed', src: PHOTO, size: 'lg', shape: 'circle', eager: true },
};
export default meta;

type Story = StoryObj<Avatar>;

export const Photo: Story = {
  play: async ({ canvas }) => {
    const img = canvas.getByRole('img', { name: 'Odunayo Mohammed' });
    await expect(img.tagName).toBe('IMG');
  },
};

export const Initials: Story = {
  args: { src: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Odunayo Mohammed' })).toHaveTextContent('OM');
  },
};

/** A photo that fails to load falls back to the initials. */
export const BrokenPhoto: Story = {
  args: { src: '/assets/profile/missing.webp' },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('OM')).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: (args) => ({
    props: { ...args, sizes: Object.keys(AVATAR_SIZES) },
    template: `
      <span style="display: inline-flex; gap: var(--gap-md); align-items: center">
        @for (s of sizes; track s) { <fm-avatar [name]="name" [src]="src" [size]="s" [eager]="true" /> }
      </span>`,
  }),
};

export const Square: Story = {
  args: { shape: 'square', src: undefined },
};
