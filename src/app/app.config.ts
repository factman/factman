import { ViewportScroller } from '@angular/common';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { CoreModule } from '@core';
import { AnchorScroller } from '@shared';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Back and forward restore the scroll position; /#about scrolls to its section.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // Anchors scroll smoothly (instantly with reduced motion) and clear the fixed header (FR-37).
    { provide: ViewportScroller, useClass: AnchorScroller },
    provideClientHydration(withEventReplay()),
    // Site settings for the deployment chosen at build time (angular.json `define`).
    importProvidersFrom(CoreModule.forRoot({ environment: FM_SITE_ENV })),
  ],
};
