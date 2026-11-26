import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import type { Project } from '@shared';
import { iconActivity, iconFolder, iconGlobe } from '@ui/atoms/icon/icons';

import { ProjectCaseStudy } from './project-case-study';

const PUBLIC = {
  id: 'graphui',
  slug: 'graphui',
  title: 'GraphUI',
  summary: 'Open-source JavaScript extension for plotting graphs on any website.',
  category: 'Open source',
  status: 'maintained',
  visibility: 'public',
  featured: true,
  stack: ['typescript'],
  role: 'Creator and maintainer: designed the API, wrote the renderer and published it on GitHub.',
  outcome: 'A small, dependency-free way to plot data on any page.',
  startedAt: '2019',
  links: { source: 'https://github.com/factman/GraphUI' },
} as unknown as Project;

/**
 * The body of a project's page: role, stack, outcome and links beside the EngageCard, with "All
 * projects" and "Next project". A private project shows no outbound links and asks for access or
 * a demo instead.
 */
const meta: Meta<ProjectCaseStudy> = {
  title: 'Organisms/ProjectCaseStudy',
  component: ProjectCaseStudy,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'padded' },
  args: {
    project: PUBLIC,
    stack: ['TypeScript', 'JavaScript'],
    facts: [
      { title: 'Status', value: 'Maintained', icon: iconActivity },
      { title: 'Visibility', value: 'Public', icon: iconGlobe },
      { title: 'Category', value: 'Open source', icon: iconFolder },
    ],
    next: { title: 'NeoClock', href: '/projects/neoclock' },
  },
};
export default meta;

type Story = StoryObj<ProjectCaseStudy>;

export const Public: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /Source code/ })).toBeVisible();
  },
};

/** Client work under NDA: no outbound links; "Request a demo". */
export const Private: Story = {
  args: {
    project: {
      ...PUBLIC,
      title: 'Payments API',
      visibility: 'private',
      engage: {
        mode: 'request-demo',
        note: 'Ledger and payouts for a fintech client. Code is under NDA; a walkthrough is available.',
      },
    } as unknown as Project,
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link', { name: /Source code/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Request a demo' })).toBeVisible();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };
