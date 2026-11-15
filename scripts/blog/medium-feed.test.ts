import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import {
  type BlogPost,
  coverUrlOf,
  decodeEntities,
  excerptOf,
  mergePosts,
  parseFeed,
  postId,
  readingMinutesOf,
  toPost,
} from './medium-feed';

const xml = readFileSync(new URL('./fixtures/feed.xml', import.meta.url), 'utf8');

describe('parseFeed', () => {
  test('reads every item with its CDATA title, link, date, categories and content', () => {
    const items = parseFeed(xml);
    assert.equal(items.length, 2);
    assert.equal(items[0].title, 'Typed APIs &amp; You: A Field Guide');
    assert.deepEqual(items[0].categories, ['typescript', 'api-design', 'TypeScript']);
    assert.match(items[0].content, /^<figure>/);
  });
});

describe('toPost', () => {
  const [first, second] = parseFeed(xml).map(toPost);

  test('maps an item to the blog.json shape', () => {
    assert.deepEqual(first, {
      id: 'typed-apis-you-a-field-guide',
      url: 'https://medium.com/@sample/typed-apis-you-a-field-guide-0a1b2c3d4e5f',
      title: 'Typed APIs & You: A Field Guide',
      publishedAt: '2026-04-03T12:52:32.000Z',
      tags: ['typescript', 'api-design'],
      excerpt:
        'Types at the edge of your API catch mistakes before they ship & save hours of debugging.',
      readingMinutes: 1,
      origin: 'rss',
    });
  });

  test('skips empty paragraphs for the excerpt', () => {
    assert.equal(second.excerpt, 'No cover on this one.');
  });

  test('finds the cover image, if any', () => {
    const items = parseFeed(xml);
    assert.equal(
      coverUrlOf(items[0].content),
      'https://cdn-images-1.medium.com/max/1024/1*sample-cover.png',
    );
    assert.equal(coverUrlOf(items[1].content), undefined);
  });

  test('rejects an item without a valid date', () => {
    assert.throws(() => toPost({ ...parseFeed(xml)[0], pubDate: 'someday' }), /Bad pubDate/);
  });
});

describe('text helpers', () => {
  test('postId drops the query and the Medium hash', () => {
    assert.equal(
      postId('https://medium.com/@a/hello-world-1a2b3c4d5e6f?source=rss'),
      'hello-world',
    );
  });

  test('decodeEntities handles named and numeric entities', () => {
    assert.equal(decodeEntities('a &amp; b &#8217;s &#x2014; &quot;c&quot;'), 'a & b ’s — "c"');
  });

  test('excerptOf cuts long text at a word, within 280 characters', () => {
    const long = `<p>${'word '.repeat(100)}</p>`;
    const excerpt = excerptOf(long);
    assert.ok(excerpt.length <= 280, String(excerpt.length));
    assert.match(excerpt, /word…$/);
  });

  test('readingMinutesOf rounds up at 238 words a minute, at least 1', () => {
    assert.equal(readingMinutesOf('<p>one</p>'), 1);
    assert.equal(readingMinutesOf(`<p>${'w '.repeat(239)}</p>`), 2);
  });
});

describe('mergePosts', () => {
  const post = (id: string, publishedAt: string, extra: Partial<BlogPost> = {}): BlogPost => ({
    id,
    url: `https://medium.com/@a/${id}`,
    title: id,
    publishedAt,
    tags: [],
    excerpt: id,
    readingMinutes: 1,
    origin: 'rss',
    ...extra,
  });

  test('keeps manual posts, updates synced ones, keeps older ones and sorts newest first', () => {
    const existing = [
      post('manual', '2026-01-01T00:00:00.000Z', { origin: 'manual', title: 'Mine' }),
      post('old', '2024-01-01T00:00:00.000Z'),
      post('updated', '2025-01-01T00:00:00.000Z', { title: 'Before', cover: 'blog/updated.webp' }),
    ];
    const incoming = [
      post('updated', '2025-01-01T00:00:00.000Z', { title: 'After' }),
      post('new', '2026-04-01T00:00:00.000Z'),
      post('manual', '2026-01-01T00:00:00.000Z', { title: 'From feed' }),
    ];
    const merged = mergePosts(existing, incoming);
    assert.deepEqual(
      merged.map((p) => p.id),
      ['new', 'manual', 'updated', 'old'],
    );
    assert.equal(merged.find((p) => p.id === 'manual')?.title, 'Mine');
    assert.equal(merged.find((p) => p.id === 'updated')?.title, 'After');
    assert.equal(merged.find((p) => p.id === 'updated')?.cover, 'blog/updated.webp');
  });

  test('is idempotent', () => {
    const once = mergePosts([], [post('a', '2026-01-01T00:00:00.000Z')]);
    assert.deepEqual(mergePosts(once, once), once);
  });
});
