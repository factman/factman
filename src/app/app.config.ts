import { ViewportScroller } from '@angular/common';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { CoreModule } from '@core';
import { AnchorScroller, pageTransition } from '@shared';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Back and forward restore the scroll position; /#about scrolls to its section.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Pages crossfade (View Transitions API, ETE-266); not on the first load, for query- or
      // fragment-only changes, or under reduced motion.
      withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated: pageTransition }),
    ),
    // Anchors scroll smoothly (instantly with reduced motion) and clear the fixed header (FR-37).
    { provide: ViewportScroller, useClass: AnchorScroller },
    // Incremental hydration: the home page's below-the-fold sections are prerendered in full and
    // hydrate when they scroll into view (`@defer (hydrate on viewport)`, ETE-114).
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    // Site settings for the deployment chosen at build time (angular.json `define`).
    importProvidersFrom(CoreModule.forRoot({ environment: FM_SITE_ENV })),
  ],
};
