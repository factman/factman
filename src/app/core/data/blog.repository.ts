import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { newestPosts } from '@data';
import { type BlogPost, CLOCK, postsFromFeed } from '@shared';

import { SITE } from '../config/site';

/** localStorage key for the cached articles (listed under necessary storage in site.json). */
export const BLOG_CACHE_KEY = 'fm_blog';

interface BlogCache {
  readonly savedAt: number;
  readonly posts: readonly BlogPost[];
}

export type BlogStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Articles read live from Medium (ETE-32, ETE-102). Nothing is stored at build time: in the
 * browser this fetches the feed through the same-origin `site.blog.feedPath` (vercel.json rewrites
 * it to Medium, whose feed sends no CORS header), keeps the parsed posts in localStorage for
 * `site.blog.cacheHours`, and leaves cover images on Medium's own URLs. On the server
 * (prerendering) it does nothing, so pages render a loading state and fill in on the client.
 */
@Injectable({ providedIn: 'root' })
export class BlogRepository {
  private readonly config = inject(SITE).blog;
  private readonly clock = inject(CLOCK);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;
  private readonly state = signal<{ status: BlogStatus; posts: readonly BlogPost[] }>({
    status: 'idle',
    posts: [],
  });
  private pending?: Promise<void>;

  /** Every article, newest first; empty until loaded. */
  readonly posts = computed(() => this.state().posts);
  readonly status = computed(() => this.state().status);
  /** The home Writing section: the newest 3 (FR-24). */
  readonly newest = computed(() => newestPosts(this.state().posts, 3));
  /** Where to send readers when the feed can't load. */
  readonly profileUrl = this.config.profile;

  /** Loads the articles once: from a fresh cache, else from Medium. Safe to call repeatedly. */
  load(): Promise<void> {
    if (!this.browser) return Promise.resolve();
    this.pending ??= this.fetchPosts();
    return this.pending;
  }

  /** Tries Medium again after an error ("Try again"). */
  retry(): Promise<void> {
    this.pending = undefined;
    return this.load();
  }

  private async fetchPosts(): Promise<void> {
    const cached = this.readCache();
    const maxAge = this.config.cacheHours * 60 * 60 * 1000;
    if (cached && this.clock().getTime() - cached.savedAt < maxAge) {
      this.state.set({ status: 'ready', posts: cached.posts });
      return;
    }
    this.state.set({ status: 'loading', posts: cached?.posts ?? [] });
    try {
      const res = await fetch(this.config.feedPath, {
        headers: { accept: 'application/rss+xml, text/xml' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const posts = postsFromFeed(await res.text());
      this.state.set({ status: 'ready', posts });
      this.writeCache({ savedAt: this.clock().getTime(), posts });
    } catch {
      // Offline or Medium unavailable: keep showing stale articles if there are any.
      this.state.set(
        cached ? { status: 'ready', posts: cached.posts } : { status: 'error', posts: [] },
      );
    }
  }

  private readCache(): BlogCache | undefined {
    try {
      const raw = this.storage?.getItem(BLOG_CACHE_KEY);
      const cache = raw ? (JSON.parse(raw) as BlogCache) : undefined;
      return cache && typeof cache.savedAt === 'number' && Array.isArray(cache.posts)
        ? cache
        : undefined;
    } catch {
      return undefined;
    }
  }

  private writeCache(cache: BlogCache): void {
    try {
      this.storage?.setItem(BLOG_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Storage full or blocked: the articles still show, they're just fetched again next time.
    }
  }
}
