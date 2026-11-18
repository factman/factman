import {
  coverUrlOf,
  decodeEntities,
  excerptOf,
  parseFeed,
  postId,
  postsFromFeed,
  readingMinutesOf,
  toPost,
} from './medium-feed';
import { SAMPLE_FEED } from './sample-feed.testing';

describe('Medium feed (ETE-32)', () => {
  it('parses every item with its CDATA title, categories and content', () => {
    const items = parseFeed(SAMPLE_FEED);
    expect(items).toHaveLength(3);
    expect(items[0].categories).toEqual(['typescript', 'api-design', 'TypeScript']);
    expect(items[0].content.startsWith('<figure>')).toBe(true);
  });

  it('maps an item to a post with its live Medium cover', () => {
    expect(toPost(parseFeed(SAMPLE_FEED)[0])).toEqual({
      id: 'typed-apis-you-a-field-guide',
      url: 'https://medium.com/@sample/typed-apis-you-a-field-guide-0a1b2c3d4e5f',
      title: 'Typed APIs & You: A Field Guide',
      publishedAt: '2026-04-03T12:52:32.000Z',
      tags: ['typescript', 'api-design'],
      excerpt:
        'Types at the edge of your API catch mistakes before they ship & save hours of debugging.',
      readingMinutes: 1,
      cover: 'https://cdn-images-1.medium.com/max/1024/1*sample-cover.png',
    });
  });

  it('lists valid posts newest first, skipping an item without a usable date', () => {
    const posts = postsFromFeed(SAMPLE_FEED);
    expect(posts.map((p) => p.id)).toEqual(['typed-apis-you-a-field-guide', 'short-note']);
    expect(posts[1].cover).toBeUndefined();
    expect(posts[1].excerpt).toBe('No cover on this one.');
    expect(postsFromFeed('<rss></rss>')).toEqual([]);
  });

  it('has text helpers for ids, entities, excerpts, reading time and covers', () => {
    expect(postId('https://medium.com/@a/hello-world-1a2b3c4d5e6f?source=rss')).toBe('hello-world');
    expect(decodeEntities('a &amp; b &#8217;s &#x2014; &quot;c&quot;')).toBe('a & b ’s — "c"');
    const excerpt = excerptOf(`<p>${'word '.repeat(100)}</p>`);
    expect(excerpt.length).toBeLessThanOrEqual(280);
    expect(excerpt.endsWith('word…')).toBe(true);
    expect(readingMinutesOf('<p>one</p>')).toBe(1);
    expect(readingMinutesOf(`<p>${'w '.repeat(239)}</p>`)).toBe(2);
    expect(coverUrlOf('<p>none</p>')).toBeUndefined();
  });
});
