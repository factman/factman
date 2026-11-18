import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsRepository } from '@core/data';

/**
 * Projects gallery (/projects), newest first. Shell until the projects page design is built.
 * @level page
 */
@Component({
  selector: 'fm-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Projects</h1>
    <ul>
      @for (project of projects; track project.slug) {
        <li>
          <a [routerLink]="['/projects', project.slug]">{{ project.title }}</a>
          <p>{{ project.summary }}</p>
        </li>
      }
    </ul>
  `,
})
export class ProjectsPage {
  protected readonly projects = inject(ProjectsRepository).all();
}
