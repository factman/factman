import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { CLOCK } from '@shared';

import { ProfileHero } from './profile-hero';

type Args = ProfileHero & { resume: (id: string) => void };

/**
 * The home page hero: availability, the name, the typed roles, summary, where and since when, the
 * calls to action, socials and counters, beside the portrait. The code editor (ETE-90) goes in
 * `[heroEditor]`. The page opens the résumé on `openResume`.
 */
const meta: Meta<Args> = {
  title: 'Organisms/ProfileHero',
  component: ProfileHero,
  decorators: [
    applicationConfig({
      // Fixed so the years don't change in the screenshots.
      providers: [provideRouter([]), { provide: CLOCK, useValue: () => new Date('2026-11-10') }],
    }),
  ],
  parameters: { layout: 'fullscreen' },
  args: {
    profile: {
      name: 'Odunayo Mohammed',
      summary:
        'I design and build web, mobile and payment products, and lead the teams that ship them. Currently CTO at Simple Finance and co-founder of ETeam Technology.',
      roles: [
        'Fullstack Software Engineer',
        'Chief Technology Officer',
        'Angular & Node.js specialist',
        'Fintech and payments builder',
      ],
      location: { city: 'Lagos', country: 'Nigeria' },
      careerStart: '2013-01',
      availability: { status: 'available', message: 'Available for new projects' },
    },
    photo: {
      src: '/assets/profile/odunayo-hero.webp',
      alt: 'Odunayo Mohammed, smiling with arms crossed, in a blue and white plaid shirt',
      width: 720,
      height: 900,
      sources: {
        avif: '/assets/profile/odunayo-hero-360.avif 360w, /assets/profile/odunayo-hero-540.avif 540w, /assets/profile/odunayo-hero-720.avif 720w',
        webp: '/assets/profile/odunayo-hero-360.webp 360w, /assets/profile/odunayo-hero-540.webp 540w, /assets/profile/odunayo-hero-720.webp 720w',
      },
    },
    socials: [
      { id: 'github', label: 'GitHub', url: 'https://github.com/factman' },
      { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mohammed-odunayo' },
      { id: 'x', label: 'X', url: 'https://x.com/MohammedFactman' },
      { id: 'medium', label: 'Medium', url: 'https://medium.com/@factman60' },
    ],
    stats: { organizations: 10, technologies: 34 },
    timezone: 'WAT · UTC+1',
    resume: fn(),
  },
  render: (args) => ({
    props: args,
    template: `
      <fm-profile-hero [profile]="profile" [photo]="photo" [socials]="socials" [stats]="stats"
        [timezone]="timezone" (openResume)="resume($event)" />`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Desktop: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Résumé/ }));
    await expect(args.resume).toHaveBeenCalledWith('fullstack');
  },
};

export const Busy: Story = {
  args: {
    profile: {
      ...meta.args!.profile!,
      availability: { status: 'limited', message: 'Booked until March' },
    },
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
