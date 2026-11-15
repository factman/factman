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
  template: `
    <h1>Blog</h1>
    @switch (blog.status()) {
      @case ('ready') {
        <ul>
          @for (post of blog.posts(); track post.id) {
            <li>
              @if (post.cover; as cover) {
                <img
                  [src]="cover"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="320"
                  height="180"
                />
              }
              <a [href]="post.url" target="_blank" rel="noopener">{{ post.title }}</a>
              <p>{{ post.excerpt }}</p>
              <p>{{ post.readingMinutes }} min read</p>
            </li>
          } @empty {
            <li>No articles yet.</li>
          }
        </ul>
      }
      @case ('error') {
        <p>
          Articles couldn't load right now. Read them on
          <a [href]="blog.profileUrl" target="_blank" rel="noopener">Medium</a>.
        </p>
      }
      @default {
        <p aria-live="polite">
          Loading articles from
          <a [href]="blog.profileUrl" target="_blank" rel="noopener">Medium</a>…
        </p>
      }
    }
  `,
})
export class BlogPage {
  protected readonly blog = inject(BlogRepository);

  constructor() {
    afterNextRender(() => void this.blog.load());
  }
}
