import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Blog (/blog): posts from Medium. Shell until blog.json (ETE-32) and the page design land.
 * @level page
 */
@Component({
  selector: 'fm-blog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Blog</h1>
    <p>Articles are on the way.</p>
  `,
})
export class BlogPage {}
