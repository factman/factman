import { NgModule } from '@angular/core';

/**
 * Data access: typed repositories over `@data` (ETE-41). Repositories are `providedIn: 'root'`
 * and imported only by the pages and resolvers that use them, so each JSON file ships only in the
 * chunks that read it. This module therefore registers no eager providers (ADR-002).
 */
@NgModule({})
export class DataModule {}
