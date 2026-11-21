import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SiteFooter } from './site-footer';

type Args = SiteFooter & { resume: (id: string) => void; consent: () => void };

/**
 * The site footer: who and availability, Explore links, the three résumés, contact and socials,
 * then the terminal sign-off and the copyright row. The page opens the résumé on `openResume` and
 * the consent banner on `cookies`.
 */
const meta: Meta<Args> = {
  title: 'Organisms/SiteFooter',
  component: SiteFooter,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'fullscreen' },
  args: {
    tagline:
      'Fullstack Software Engineer and CTO in Lagos, Nigeria. Building web, mobile and payment products since 2013.',
    nav: [
      { label: 'Services', href: '/services' },
      { label: 'Projects', href: '/projects' },
      { label: 'Blog', href: '/blog' },
      { label: 'Privacy', href: '/privacy' },
    ],
    resumes: [
      { id: 'fullstack', title: 'Fullstack Software Engineer' },
      { id: 'mobile', title: 'Mobile Developer' },
      { id: 'devops', title: 'DevOps / Cloud Engineer' },
    ],
    email: 'factman60@gmail.com',
    location: 'Lagos, Nigeria · WAT (UTC+1)',
    socials: [
      { id: 'github', label: 'GitHub', url: 'https://github.com/factman' },
      { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mohammed-odunayo' },
      { id: 'x', label: 'X', url: 'https://x.com/MohammedFactman' },
      { id: 'medium', label: 'Medium', url: 'https://medium.com/@factman60' },
    ],
    availability: 'available',
    availabilityLabel: 'Available for new projects',
    // Fixed so screenshots don't change on 1 January.
    year: 2026,
    resume: fn(),
    consent: fn(),
  },
  render: (args, { globals }) => ({
    props: { ...args, theme: globals['theme'] === 'dark' ? 'dark' : 'light' },
    template: `
      <fm-site-footer [theme]="theme" [tagline]="tagline" [nav]="nav" [resumes]="resumes"
        [email]="email" [location]="location" [socials]="socials" [availability]="availability"
        [availabilityLabel]="availabilityLabel" [year]="year"
        (openResume)="resume($event)" (cookies)="consent()" />`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Desktop: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'DevOps / Cloud Engineer' }));
    await expect(args.resume).toHaveBeenCalledWith('devops');
    await userEvent.click(canvas.getByRole('button', { name: 'cookie settings' }));
    await expect(args.consent).toHaveBeenCalledOnce();
    const explore = within(canvas.getByRole('navigation', { name: 'Explore' }));
    await expect(explore.getAllByRole('link')).toHaveLength(4);
  },
};

export const Busy: Story = {
  args: { availability: 'busy', availabilityLabel: 'Booked until March' },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };
