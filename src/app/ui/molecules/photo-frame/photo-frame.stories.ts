import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Logo } from '@ui/atoms/logo/logo';

import { AvailabilityBadge } from '../availability-badge/availability-badge';
import { PhotoFrame } from './photo-frame';

const P = '/assets/profile/odunayo-hero';
const image = {
  src: `${P}-540.webp`,
  alt: 'Odunayo Mohammed, smiling',
  width: 360,
  height: 450,
  sources: {
    avif: `${P}-360.avif 360w, ${P}-540.avif 540w, ${P}-720.avif 720w`,
    webp: `${P}-360.webp 360w, ${P}-540.webp 540w, ${P}-720.webp 720w`,
  },
  sizes: '(min-width: 768px) 420px, 90vw',
};

/** A photo in the glass frame with content over it. */
const meta: Meta<PhotoFrame> = {
  title: 'Molecules/PhotoFrame',
  component: PhotoFrame,
  decorators: [moduleMetadata({ imports: [AvailabilityBadge, Logo] })],
  args: { image, variant: 'plate', priority: true },
};
export default meta;

type Story = StoryObj<PhotoFrame>;

/** About: the portrait with the logo plate. */
export const Plate: Story = {
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px; padding-right: var(--gap-xl)"><fm-photo-frame [image]="image" variant="plate" [priority]="true"><fm-logo type="odunayo" [size]="32" /></fm-photo-frame></div>`,
  }),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Odunayo Mohammed, smiling' })).toBeVisible();
  },
};

/** Contact: a note card over the photo. */
export const Note: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 640px">
        <fm-photo-frame [image]="image" variant="note" [priority]="true">
          <fm-availability-badge />
          <p style="margin: 0; font: 600 18px/1.35 var(--font-sans)">Got a project in mind?</p>
          <p style="margin: 0; font: 400 13px/1.6 var(--font-sans); color: var(--text-secondary)">I reply to every message, usually within a day.</p>
        </fm-photo-frame>
      </div>`,
  }),
};
