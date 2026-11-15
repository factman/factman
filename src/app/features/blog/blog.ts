import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BlogRepository } from '@core/data';

/**
 * Blog (/blog): articles read live from Medium in the browser (ETE-32). The prerendered page has
 * the heading and a link to Medium; the list fills in after hydration. Shell until the design is
 * built (ETE-101).
 * @level page
 */
@Component({
  selector: 'fm-blog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog.html',
})
export class BlogPage {
  protected readonly blog = inject(BlogRepository);

  constructor() {
    afterNextRender(() => void this.blog.load());
  }
}
