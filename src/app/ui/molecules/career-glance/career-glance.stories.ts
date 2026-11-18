import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { CareerGlance } from './career-glance';

/** The Experience section's side panel: current roles, numbers and the résumé link. */
const meta: Meta<CareerGlance> = {
  title: 'Molecules/CareerGlance',
  component: CareerGlance,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    roles: [
      { title: 'Chief Technology Officer', description: 'Simple Finance · since Jan 2024' },
      { title: 'CTO & Co-Founder', description: 'ETeam Technology · since May 2017' },
    ],
    stats: [
      { value: 12, suffix: '+', label: 'years since 2013' },
      { value: 10, label: 'organizations' },
      { value: 12, label: 'roles' },
      { value: 2, label: 'current roles' },
    ],
    resumeHref: '#resume',
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-career-glance [roles]="roles" [stats]="stats" [resumeHref]="resumeHref" /></div>`,
  }),
};
export default meta;

export const Glance: StoryObj<CareerGlance> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /Get the résumé/ })).toBeVisible();
  },
};
