import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Image } from './image';

const P = '/assets/profile/odunayo-hero';

/** A responsive picture: AVIF and WebP sources, a sized fallback, lazy unless `priority`. */
const meta: Meta<Image> = {
  title: 'Atoms/Image',
  component: Image,
  args: {
    src: `${P}-360.webp`,
    alt: 'Odunayo Mohammed',
    width: 360,
    height: 450,
    sources: {
      avif: `${P}-360.avif 360w, ${P}-540.avif 540w, ${P}-720.avif 720w`,
      webp: `${P}-360.webp 360w, ${P}-540.webp 540w, ${P}-720.webp 720w`,
    },
    sizes: '360px',
    priority: true,
  },
};
export default meta;

type Story = StoryObj<Image>;

export const Portrait: Story = {
  play: async ({ canvas }) => {
    const img = canvas.getByRole('img', { name: 'Odunayo Mohammed' });
    await expect(img).toHaveAttribute('width', '360');
  },
};

export const Lazy: Story = { args: { priority: false } };
