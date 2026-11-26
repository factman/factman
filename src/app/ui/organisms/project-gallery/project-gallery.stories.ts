import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import type { Project } from '@shared';
import { iconArrowRight, iconGithub } from '@ui/atoms/icon/icons';

import { ProjectGallery } from './project-gallery';

const gh = 'https://github.com/factman';
const PROJECTS = [
  {
    slug: 'covid-daily-update',
    title: 'Coronavirus Daily Update',
    summary: 'Mobile app with daily COVID-19 case updates.',
    category: 'Mobile',
    status: 'completed',
    visibility: 'public',
    stack: ['React Native', 'Node.js'],
    links: { repo: gh },
  },
  {
    slug: 'covid19-api',
    title: 'Covid-19 Daily Update API',
    summary: 'The API behind the daily figures.',
    category: 'API',
    status: 'completed',
    visibility: 'public',
    stack: ['Node.js', 'Express.js'],
    links: { repo: gh },
  },
  {
    slug: 'graphui',
    title: 'GraphUI',
    summary: 'Open-source JavaScript extension for plotting graphs.',
    category: 'Open source',
    status: 'maintained',
    visibility: 'public',
    stack: ['TypeScript'],
    links: { repo: `${gh}/GraphUI` },
  },
  {
    slug: 'ubuntu-server-setup',
    title: 'Ubuntu Server Setup',
    summary: 'Scripts for setting up a fresh Ubuntu server.',
    category: 'DevOps',
    status: 'maintained',
    visibility: 'public',
    stack: ['Bash', 'Linux'],
    links: { repo: gh },
  },
  {
    slug: 'neoclock',
    title: 'NeoClock',
    summary: 'A clock app for the browser.',
    category: 'Web',
    status: 'archived',
    visibility: 'public',
    stack: ['JavaScript', 'CSS'],
    links: { repo: gh },
  },
  {
    slug: 'todo-app',
    title: 'ToDo App',
    summary: 'A to-do list app.',
    category: 'Web',
    status: 'archived',
    visibility: 'public',
    stack: ['JavaScript'],
    links: { repo: gh },
  },
].map((p, i) => ({
  id: p.slug,
  featured: true,
  startedAt: String(2020 - i),
  ...p,
})) as unknown as Project[];

/**
 * Project cards in a grid of three. On /projects (`filterable`) the status and category chips and
 * the search filter them, with a live count and an empty state; on home, at most six featured with
 * "See all projects" and the GitHub profile under them.
 */
const meta: Meta<ProjectGallery> = {
  title: 'Organisms/ProjectGallery',
  component: ProjectGallery,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'padded' },
  args: { projects: PROJECTS },
};
export default meta;

type Story = StoryObj<ProjectGallery>;

export const Home: Story = {
  args: {
    actions: [
      { label: 'See all projects', href: '/projects', trailingIcon: iconArrowRight },
      { label: 'GitHub profile', href: gh, leadingIcon: iconGithub },
    ],
  },
};

export const Filterable: Story = {
  args: { filterable: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('6 of 6 projects')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Archived/ }));
  },
};

export const Empty: Story = {
  args: { filterable: true, filter: { status: [], category: [], query: 'nothing like this' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No projects match')).toBeVisible();
  },
};

export const Mobile: Story = {
  args: { filterable: true },
  globals: { viewport: { value: 'mobile' } },
};

export const Dark: Story = { args: { filterable: true }, globals: { theme: 'dark' } };
