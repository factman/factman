import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ANALYTICS_TRACKER, type BlogPost, postsFromFeed } from '@shared';

import { SAMPLE_FEED } from '../../../shared/blog/sample-feed.testing';

import { BlogFeed, postTags } from './blog-feed';

const PROFILE = 'https://medium.com/@factman60';
const posts: BlogPost[] = postsFromFeed(SAMPLE_FEED);

const renderFeed = (inputs: Record<string, unknown>) =>
  render(BlogFeed, { inputs: { posts, status: 'ready', profileUrl: PROFILE, ...inputs } });

describe('postTags', () => {
  it('collects the tags in first-seen order', () => {
    expect(postTags([{ tags: ['a', 'b'] }, { tags: ['b', 'c'] }])).toEqual(['a', 'b', 'c']);
  });
});

describe('BlogFeed', () => {
  it('shows the loading state with a link to Medium (what prerendering ships)', async () => {
    await renderFeed({ status: 'idle', posts: [] });
    expect(screen.getByText(/Loading articles from/).getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('link', { name: /Medium/ }).getAttribute('href')).toBe(PROFILE);
  });

  it('lists the articles, each opening on Medium in a new tab', async () => {
    const { container } = await renderFeed({});
    const link = screen.getByRole('link', { name: /Typed APIs & You: A Field Guide/ });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/medium\.com\//);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(container.querySelectorAll('.blog-feed-list > li')).toHaveLength(posts.length);
  });

  it('shows at most `limit` articles', async () => {
    const { container } = await renderFeed({ limit: 1 });
    expect(container.querySelectorAll('.blog-feed-list > li')).toHaveLength(1);
  });

  it('says there are no articles yet when the feed is empty', async () => {
    await renderFeed({ posts: [] });
    expect(screen.getByText(/No articles yet/)).toBeTruthy();
  });

  it('shows an error with a link to Medium and "Try again"', async () => {
    const retry = vi.fn();
    await render(BlogFeed, {
      inputs: { posts: [], status: 'error', profileUrl: PROFILE },
      on: { retry },
    });
    expect(screen.getByRole('alert').textContent).toContain("Articles couldn't load right now.");
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(retry).toHaveBeenCalled();
  });

  it('filters by tag on /blog, with a live count', async () => {
    await renderFeed({ filterable: true });
    const tag = postTags(posts).find(
      (t) => posts.filter((p) => p.tags.includes(t)).length < posts.length,
    )!;
    await userEvent.click(screen.getByRole('button', { name: tag }));
    const matching = posts.filter((p) => p.tags.includes(tag)).length;
    expect(screen.getByText(`${matching} of ${posts.length} articles`)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Filter articles by tag' })).toBeTruthy();
  });
});

describe('BlogFeed analytics (filter_used)', () => {
  it('sends filter_used with the tag when a tag chip is picked', async () => {
    const track = vi.fn();
    await render(BlogFeed, {
      inputs: { posts, status: 'ready', profileUrl: PROFILE, filterable: true },
      providers: [{ provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    const tag = postTags(posts)[0];
    await userEvent.click(screen.getByRole('button', { name: tag }));
    expect(track).toHaveBeenCalledWith('filter_used', { scope: 'blog', value: tag });
  });
});
