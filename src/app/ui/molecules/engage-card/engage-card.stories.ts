import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { iconActivity, iconFolder, iconGlobe } from '@ui/atoms';

import { EngageCard } from './engage-card';

/** The project page's "How to engage" card. */
const meta: Meta<EngageCard> = {
  title: 'Molecules/EngageCard',
  component: EngageCard,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: {
    project: { title: 'Investa.ng', visibility: 'public' },
    facts: [
      { title: 'Status', value: 'Completed', icon: iconActivity },
      { title: 'Visibility', value: 'Public', icon: iconGlobe },
      { title: 'Category', value: 'Fintech', icon: iconFolder },
    ],
    requestAccess: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-engage-card [project]="project" [facts]="facts" (requestAccess)="requestAccess()" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<EngageCard>;

export const Public: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask about this project' }));
    await expect(args.requestAccess).toHaveBeenCalled();
  },
};

export const Private: Story = {
  args: {
    project: {
      title: 'Ledger',
      visibility: 'private',
      engage: {
        mode: 'request-access',
        note: 'Client work under NDA. Access is granted case by case.',
      },
    },
  },
};
