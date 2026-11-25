import { TestBed } from '@angular/core/testing';
import { BlogRepository } from '@core/data';

import { SAMPLE_FEED } from '../shared/blog/sample-feed.testing';

import { openApp } from './it-harness';

// IT-11 (US-13, US-14): the blog lists the Medium feed (blog.json was replaced by the live feed,
// ETE-32); every article opens on Medium in a new tab with rel="noopener noreferrer".
describe('IT-11 Blog list matches the feed; links are external with the right rel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(SAMPLE_FEED, { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it.each(['/blog', '/'])('%s lists the feed with safe external links', async (url) => {
    const { page, settle } = await openApp(url);
    await new Promise((r) => setTimeout(r));
    await settle();
    // The articles the repository parsed from the feed (items it cannot read are dropped).
    const posts = TestBed.inject(BlogRepository).posts();
    expect(posts.length).toBeGreaterThan(0);
    const feed = page.querySelector('fm-blog-feed')!;
    for (const post of posts) expect(feed.textContent).toContain(post.title);
    const links = [...feed.querySelectorAll('a[href^="https://"]')];
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });
});
