import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { BlogPostCard } from './blog-post-card';

/** A Medium article; the whole card links to it in a new tab. */
const meta: Meta<BlogPostCard> = {
  title: 'Molecules/BlogPostCard',
  component: BlogPostCard,
  argTypes: { layout: { control: 'inline-radio', options: ['card', 'row'] } },
  args: {
    layout: 'card',
    post: {
      id: 'p1',
      url: 'https://medium.com/@factman60',
      title: 'Signals in a real Angular app',
      publishedAt: '2025-03-12T08:00:00Z',
      tags: ['Angular', 'Signals', 'Frontend'],
      excerpt:
        'What changed when we moved a large production app from RxJS-heavy components to signals, and what we would do differently.',
      readingMinutes: 6,
    },
  },
  render: (args) => ({
    props: args,
    template: `<div [style.max-width]="layout === 'row' ? '640px' : '380px'"><fm-blog-post-card [post]="post" [layout]="layout" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<BlogPostCard>;

export const Card: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: /Signals in a real Angular app/ }),
    ).toHaveAttribute('target', '_blank');
  },
};

export const Row: Story = { args: { layout: 'row' } };
