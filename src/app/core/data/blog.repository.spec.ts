import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CLOCK, resolveSite, type Site } from '@shared';

import site from '../../../data/site.json';
import { SAMPLE_FEED } from '../../shared/blog/sample-feed.testing';
import { SITE } from '../config/site';
import { BLOG_CACHE_KEY, BlogRepository } from './blog.repository';

const HOUR = 60 * 60 * 1000;
const start = new Date('2026-11-15T08:00:00Z');

function setup(now: Date, platform = 'browser') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: SITE, useValue: resolveSite(site as Site, 'production') },
      { provide: CLOCK, useValue: () => now },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return TestBed.inject(BlogRepository);
}

describe('BlogRepository (live Medium feed, 12 h cache)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn(async () => new Response(SAMPLE_FEED, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fetches the feed through the same-origin path and caches the posts', async () => {
    const blog = setup(start);
    await blog.load();
    expect(fetchMock).toHaveBeenCalledWith('/feeds/medium', expect.anything());
    expect(blog.status()).toBe('ready');
    expect(blog.posts().map((p) => p.id)).toEqual(['typed-apis-you-a-field-guide', 'short-note']);
    expect(blog.posts()[0].cover).toMatch(/^https:\/\/cdn-images-1\.medium\.com\//);
    expect(JSON.parse(localStorage.getItem(BLOG_CACHE_KEY)!).savedAt).toBe(start.getTime());
  });

  it('serves the cache for 12 hours without fetching, then fetches again', async () => {
    await setup(start).load();
    fetchMock.mockClear();

    const later = setup(new Date(start.getTime() + 11 * HOUR));
    await later.load();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(later.posts()).toHaveLength(2);

    const stale = setup(new Date(start.getTime() + 12 * HOUR + 1));
    await stale.load();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows stale posts when Medium is unreachable, and an error state without any', async () => {
    await setup(start).load();
    fetchMock.mockRejectedValue(new Error('offline'));

    const offline = setup(new Date(start.getTime() + 24 * HOUR));
    await offline.load();
    expect(offline.status()).toBe('ready');
    expect(offline.posts()).toHaveLength(2);

    localStorage.clear();
    const empty = setup(new Date(start.getTime() + 24 * HOUR));
    await empty.load();
    expect(empty.status()).toBe('error');
    expect(empty.posts()).toEqual([]);
  });

  it('tries Medium again on retry after an error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const blog = setup(start);
    await blog.load();
    expect(blog.status()).toBe('error');
    await blog.load();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await blog.retry();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(blog.status()).toBe('ready');
  });

  it('still works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const blog = setup(start);
    await blog.load();
    expect(blog.posts()).toHaveLength(2);
    vi.restoreAllMocks();
  });

  it('does nothing while prerendering on the server', async () => {
    const blog = setup(start, 'server');
    await blog.load();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(blog.status()).toBe('idle');
  });

  it('loads once even when asked repeatedly', async () => {
    const blog = setup(start);
    await Promise.all([blog.load(), blog.load()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
