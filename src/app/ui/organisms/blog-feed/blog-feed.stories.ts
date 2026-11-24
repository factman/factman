import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import type { BlogPost } from '@shared';

import { BlogFeed } from './blog-feed';

const u = 'https://medium.com/@factman60';
const POSTS: BlogPost[] = [
  ['structuring-angular', 'Structuring a large Angular workspace', ['angular', 'architecture'], 8],
  ['payments-without-pain', 'Payments without the pain', ['fintech', 'payments'], 6],
  ['node-api-checklist', 'A Node.js API checklist', ['nodejs', 'architecture'], 5],
  ['engineer-to-cto', 'From engineer to CTO', ['leadership'], 7],
].map(([id, title, tags, readingMinutes], i) => ({
  id: id as string,
  url: `${u}/${id}`,
  title: title as string,
  publishedAt: `2026-${String(10 - i).padStart(2, '0')}-12T09:00:00Z`,
  tags: tags as string[],
  excerpt: 'What I learned shipping this, and what I would do differently next time.',
  readingMinutes: readingMinutes as number,
}));

/**
 * The articles from Medium: loading (what prerendering ships), ready, empty and error, with tag
 * chips on /blog. Each card opens the article on Medium in a new tab.
 */
const meta: Meta<BlogFeed> = {
  title: 'Organisms/BlogFeed',
  component: BlogFeed,
  parameters: { layout: 'padded' },
  args: { posts: POSTS, status: 'ready', profileUrl: u },
};
export default meta;

type Story = StoryObj<BlogFeed>;

export const Home: Story = { args: { limit: 3 } };

export const Filterable: Story = {
  args: { filterable: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('4 of 4 articles')).toBeVisible();
  },
};

export const Loading: Story = { args: { status: 'idle', posts: [] } };

export const Error: Story = {
  args: { status: 'error', posts: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeVisible();
  },
};

export const Empty: Story = { args: { posts: [] } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

export const Dark: Story = { args: { filterable: true }, globals: { theme: 'dark' } };
