import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { CareerGlance } from './career-glance';

/** The Experience section's side panel: current roles, numbers and "Get the résumé". */
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
    openResume: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-career-glance [roles]="roles" [stats]="stats" (openResume)="openResume()" /></div>`,
  }),
};
export default meta;

export const Glance: StoryObj<CareerGlance> = {
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: /Get the résumé/ });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.openResume).toHaveBeenCalled();
  },
};
