import { inject, NgModule, provideAppInitializer } from '@angular/core';

import { ThemeService } from './theme.service';

/** Light and Dark theme (FR-04): `ThemeService`, started with the app so `data-theme` stays in step. */
@NgModule({
  providers: [ThemeService, provideAppInitializer(() => void inject(ThemeService))],
})
export class ThemeModule {}
