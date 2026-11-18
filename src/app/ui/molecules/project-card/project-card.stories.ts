import { provideRouter } from '@angular/router';
import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';

import { PRIVATE_PROJECT, PUBLIC_PROJECT } from './project-card.fixtures';
import { ProjectCard } from './project-card';

/** A project in the grid; the whole card links to its page. */
const meta: Meta<ProjectCard> = {
  title: 'Molecules/ProjectCard',
  component: ProjectCard,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  args: { project: PUBLIC_PROJECT, href: '/projects/investa', engage: fn() },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 380px"><fm-project-card [project]="project" [href]="href" (engage)="engage($event)" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<ProjectCard>;

export const Public: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /Live site/ })).toBeVisible();
  },
};

/** No public links: the engage action instead (FR-22). */
export const Private: Story = { args: { project: PRIVATE_PROJECT, href: '/projects/ledger' } };
