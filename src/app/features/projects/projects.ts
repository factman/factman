import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Projects gallery (/projects). Shell until projects.json (ETE-31) and the page design land.
 * @level page
 */
@Component({
  selector: 'fm-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Projects</h1>
    <p>Case studies are on the way.</p>
  `,
})
export class ProjectsPage {}
