import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { type BlogPost, Track } from '@shared';
import { Icon, Image, Tag, iconArrowUpRight } from '@ui/atoms';

/** "12 Mar 2025": dates in UK day-month order, the same on the server and in the browser. */
export const postDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));

/**
 * A Medium article: cover, date and reading time, title, excerpt and tags. The whole card is one
 * link to the article on Medium, which opens in a new tab (and says so). `row` is the compact
 * list layout with a small cover on the left.
 * @level molecule
 */
@Component({
  selector: 'fm-blog-post-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './blog-post-card.scss',
  imports: [Icon, Image, Tag, Track],
  host: { style: 'display: contents' },
  templateUrl: './blog-post-card.html',
})
export class BlogPostCard {
  readonly post = input.required<BlogPost>();
  readonly layout = input<'card' | 'row'>('card');
  readonly headingLevel = input<2 | 3>(3);
  /** Where the card is, for the blog_click event. */
  readonly location = input<'home' | 'blog'>('blog');

  protected readonly external = iconArrowUpRight;
  protected readonly date = computed(() => postDate(this.post().publishedAt));
}
