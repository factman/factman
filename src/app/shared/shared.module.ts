import { NgModule } from '@angular/core';

/**
 * Standalone pipes and directives shared by molecules, organisms, templates and pages (atoms use
 * tokens only, so they never import it). Import the module, or the single standalone piece you need.
 * Framework-free helpers and the generated data models are plain exports of `@shared`.
 */
@NgModule({
  imports: [],
  exports: [],
})
export class SharedModule {}
