import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Project } from '@shared';

/**
 * One project (/projects/:slug), resolved by `projectResolver`. Shell until the design is built.
 * @level page
 */
@Component({
  selector: 'fm-project-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>{{ project().title }}</h1>
    <p>{{ project().summary }}</p>
    @if (project().links.source; as source) {
      <p><a [href]="source" rel="noopener">View source</a></p>
    }
    <p><a routerLink="/projects">All projects</a></p>
  `,
})
export class ProjectDetailPage {
  /** Bound from the route's resolved `project` data (withComponentInputBinding). */
  readonly project = input.required<Project>();
}
