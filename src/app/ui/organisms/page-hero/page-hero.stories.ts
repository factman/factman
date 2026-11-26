import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconCalendar, iconGrid, iconWorkflow } from '@ui/atoms/icon/icons';

import { PageHero } from './page-hero';

const portrait = {
  src: '/assets/profile/odunayo-about.webp',
  alt: 'Odunayo Mohammed in a three-quarter view, smiling, arms crossed',
  width: 720,
  height: 900,
  sources: {
    avif: '/assets/profile/odunayo-about-360.avif 360w, /assets/profile/odunayo-about-540.avif 540w, /assets/profile/odunayo-about-720.avif 720w',
    webp: '/assets/profile/odunayo-about-360.webp 360w, /assets/profile/odunayo-about-540.webp 540w, /assets/profile/odunayo-about-720.webp 720w',
  },
  sizes: '(min-width: 1024px) 420px, 360px',
};

/**
 * The top of a sub-page: breadcrumbs, eyebrow or icon and tags, the h1, a lead, meta, and the calls
 * to action (the first primary), beside a cutout portrait or a framed image. "Schedule a call"
 * emits `schedule` for the page's scheduler.
 */
const meta: Meta<PageHero> = {
  title: 'Organisms/PageHero',
  component: PageHero,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'fullscreen' },
  args: {
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Services' }],
    eyebrow: 'Services',
    title: 'Senior help for the work that matters most',
    lead: 'Eight ways to work together, from a one-off architecture review to a fractional CTO who sits with your team.',
    actions: [
      { label: 'Schedule a call', schedule: true, trailingIcon: iconCalendar },
      { label: 'Browse services', href: '#catalogue', leadingIcon: iconGrid },
    ],
    media: portrait,
  },
};
export default meta;

type Story = StoryObj<PageHero>;

export const Services: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };

/** A service's page: the icon tile, meta facts, no picture. */
export const Service: Story = {
  args: {
    crumbs: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'DevOps' },
    ],
    eyebrow: undefined,
    icon: iconWorkflow,
    title: 'DevOps',
    lead: 'CI/CD pipelines and containers so your team ships safely every day.',
    meta: ['5 deliverables', 'Quote per engagement'],
    actions: [
      { label: 'Schedule a call', schedule: true, service: 'DevOps', trailingIcon: iconCalendar },
    ],
    media: undefined,
  },
};
