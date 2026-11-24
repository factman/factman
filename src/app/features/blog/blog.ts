import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BlogRepository } from '@core/data';
import { site } from '@data/site';
import { iconArrowUpRight, iconMedium, iconRss } from '@ui/atoms';
import { BlogFeed, type HeroAction, PageHero } from '@ui/organisms';

/**
 * Blog (/blog, FR-25): PageHero with "Follow on Medium" and the RSS feed, then every article read
 * live from Medium in the browser (ETE-32), newest first, with the tag filter. The prerendered
 * page has the heading and a link to Medium; the list fills in after hydration.
 * @level page
 */
@Component({
  selector: 'fm-blog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogFeed, PageHero],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class BlogPage {
  protected readonly blog = inject(BlogRepository);
  protected readonly crumbs = [{ label: 'Home', href: '/' }, { label: 'Blog' }];
  protected readonly actions: HeroAction[] = [
    {
      label: 'Follow on Medium',
      href: site.blog.profile,
      leadingIcon: iconMedium,
      trailingIcon: iconArrowUpRight,
      variant: 'secondary',
    },
    { label: 'RSS feed', href: site.blog.feed, leadingIcon: iconRss, variant: 'tertiary' },
  ];

  constructor() {
    afterNextRender(() => void this.blog.load());
  }
}
