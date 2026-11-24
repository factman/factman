import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import {
  iconBraces,
  iconCloud,
  iconDatabase,
  iconFileCode,
  iconGitBranch,
  iconLayout,
  iconMobile,
  iconPackage,
  iconServer,
  iconTerminal,
} from '@ui/atoms';

import { type StackGroup, TechStack } from './tech-stack';

const GROUPS: StackGroup[] = [
  {
    category: 'Languages',
    items: [
      { id: 'js', name: 'JavaScript', icon: iconBraces, years: 12, featured: true },
      { id: 'ts', name: 'TypeScript', icon: iconBraces, years: 9, featured: true },
      { id: 'php', name: 'PHP', icon: iconFileCode, years: 12 },
      { id: 'bash', name: 'Bash', icon: iconTerminal },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { id: 'angular', name: 'Angular', icon: iconLayout, years: 9, featured: true },
      { id: 'react', name: 'React', icon: iconLayout, years: 8, featured: true },
      { id: 'next', name: 'Next.js', icon: iconLayout, years: 5 },
    ],
  },
  {
    category: 'Backend',
    items: [{ id: 'node', name: 'Node.js', icon: iconServer, years: 10, featured: true }],
  },
  {
    category: 'Mobile',
    items: [{ id: 'rn', name: 'React Native', icon: iconMobile, years: 7, featured: true }],
  },
  {
    category: 'Data',
    items: [
      { id: 'pg', name: 'PostgreSQL', icon: iconDatabase, years: 8 },
      { id: 'mongo', name: 'MongoDB', icon: iconDatabase, years: 8 },
    ],
  },
  {
    category: 'Cloud & DevOps',
    items: [
      { id: 'docker', name: 'Docker', icon: iconPackage, years: 6, featured: true },
      { id: 'aws', name: 'AWS', icon: iconCloud, years: 6, featured: true },
    ],
  },
  {
    category: 'Tools',
    items: [{ id: 'git', name: 'Git', icon: iconGitBranch, years: 12, featured: true }],
  },
];

/**
 * The Stack section's body: category chips that filter the areas, the technologies grouped by
 * area on a glass panel with their years of use (featured first), and a live summary. The page
 * wraps it in SectionLayout (`#stack`) and computes the years from skills.json.
 */
const meta: Meta<TechStack> = {
  title: 'Organisms/TechStack',
  component: TechStack,
  parameters: { layout: 'padded' },
  args: { groups: GROUPS, filter: true },
};
export default meta;

type Story = StoryObj<TechStack>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(GROUPS.length);
    await userEvent.click(canvas.getByRole('button', { name: 'Frontend' }));
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    await expect(canvas.getByText('3 technologies in Frontend')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'All' }));
  },
};

export const Tablet: Story = { globals: { viewport: { value: 'tablet' } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { globals: { theme: 'dark' } };

/** Without the category chips. */
export const NoFilter: Story = { args: { filter: false } };
