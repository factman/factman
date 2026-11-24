import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import type { BlogPost } from '@shared';
import { Button, Chip, iconRefresh, Skeleton } from '@ui/atoms';
import { BlogPostCard } from '@ui/molecules';

/** Where the feed is: before the browser has fetched it, fetched, or failed. */
export type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

/** The tag filter's "every article" option. */
export const ALL_TAGS = 'All';

/** Every tag, in first-seen order (posts are newest first). */
export const postTags = (posts: readonly Pick<BlogPost, 'tags'>[]): string[] => [
  ...new Set(posts.flatMap((p) => p.tags)),
];

/**
 * The articles from Medium (FR-24, FR-25, the canvas's WritingSection): BlogPostCards in a grid of
 * three, each opening on Medium in a new tab. The feed loads in the browser, so the prerendered
 * page shows the loading state with a link to Medium; then the articles (at most `limit`), "No
 * articles yet", or an error with a link to Medium and "Try again" (`retry`). With `filterable`
 * (the /blog page) tag chips filter the list, with a live count.
 * @level organism
 */
@Component({
  selector: 'fm-blog-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // blog-feed* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './blog-feed.scss',
  imports: [BlogPostCard, Button, Chip, Skeleton],
  host: { style: 'display: contents' },
  templateUrl: './blog-feed.html',
})
export class BlogFeed {
  readonly posts = input.required<readonly BlogPost[]>();
  readonly status = input.required<FeedStatus>();
  /** The Medium profile, for the loading, empty and error states. */
  readonly profileUrl = input.required<string>();
  /** Shows at most this many. */
  readonly limit = input<number>();
  readonly filterable = input(false);
  readonly headingLevel = input<2 | 3>(3);

  readonly retry = output<void>();

  protected readonly refresh = iconRefresh;
  protected readonly placeholders = [0, 1, 2];
  protected readonly tag = signal(ALL_TAGS);
  protected readonly tags = computed(() => [ALL_TAGS, ...postTags(this.posts())]);
  protected readonly filtered = computed(() => {
    const tag = this.tag();
    return !this.filterable() || tag === ALL_TAGS
      ? this.posts()
      : this.posts().filter((p) => p.tags.includes(tag));
  });
  protected readonly shown = computed(() => {
    const limit = this.limit();
    return limit === undefined ? this.filtered() : this.filtered().slice(0, limit);
  });
  protected readonly count = computed(
    () => `${this.filtered().length} of ${this.posts().length} articles`,
  );
}
