import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { NotFoundSection } from './not-found-section';

const base = '/assets/profile/odunayo-thinking';

/** The not-found page's content: the 404 terminal, Go home and suggested pages, the portrait. */
const meta: Meta<NotFoundSection> = {
  title: 'Organisms/NotFoundSection',
  component: NotFoundSection,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'fullscreen' },
  args: {
    path: '/this-page',
    suggestions: [
      { label: 'Projects', href: '/projects' },
      { label: 'Services', href: '/services' },
      { label: 'Blog', href: '/blog' },
    ],
    photo: {
      src: `${base}.webp`,
      alt: 'Odunayo Mohammed with a hand on his chin in a thinking pose',
      width: 720,
      height: 900,
      sources: {
        avif: `${base}-360.avif 360w, ${base}-540.avif 540w, ${base}-720.avif 720w`,
        webp: `${base}-360.webp 360w, ${base}-540.webp 540w, ${base}-720.webp 720w`,
      },
    },
  },
};
export default meta;

type Story = StoryObj<NotFoundSection>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'command not found' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Go home' })).toBeVisible();
  },
};

export const UnknownProject: Story = { args: { path: '/projects/does-not-exist' } };

export const WithoutPhoto: Story = { args: { photo: undefined } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };
