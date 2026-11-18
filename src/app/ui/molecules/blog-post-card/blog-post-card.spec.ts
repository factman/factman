import { render, screen } from '@testing-library/angular';

import { BlogPostCard, postDate } from './blog-post-card';

const post = {
  id: 'p1',
  url: 'https://medium.com/@factman60/angular-signals',
  title: 'Signals in a real Angular app',
  publishedAt: '2025-03-12T08:00:00Z',
  tags: ['angular', 'signals', 'frontend', 'extra'],
  excerpt: 'What changed when we moved a large app to signals.',
  readingMinutes: 6,
};

describe('BlogPostCard', () => {
  it('formats dates in UK order', () => {
    expect(postDate('2025-03-12T08:00:00Z')).toBe('12 Mar 2025');
  });

  it('is one external link to Medium with date, reading time and up to three tags', async () => {
    await render(BlogPostCard, { inputs: { post } });
    const link = screen.getByRole('link', {
      name: /Signals in a real Angular app.*opens Medium in a new tab/,
    });
    expect(link.getAttribute('href')).toBe(post.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText('12 Mar 2025').getAttribute('datetime')).toBe(post.publishedAt);
    expect(screen.getByText(/6 min read/)).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Tags' }).querySelectorAll('li')).toHaveLength(3);
  });

  it('has a compact row layout', async () => {
    await render(BlogPostCard, { inputs: { post, layout: 'row' } });
    expect(screen.getByRole('article').classList).toContain('is-row');
  });
});
