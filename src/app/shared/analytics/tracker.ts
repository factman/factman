import { InjectionToken } from '@angular/core';

import type { AnalyticsEventName, AnalyticsEvents } from './analytics-events';

/** Sends an analytics event. A no-op until the visitor allows analytics (core's AnalyticsService). */
export interface AnalyticsTracker {
  track<K extends AnalyticsEventName>(name: K, params: AnalyticsEvents[K]): void;
}

/**
 * The tracker components send events to. Core provides AnalyticsService; anywhere it isn't
 * provided (Storybook, unit tests of a single component) events go nowhere.
 */
export const ANALYTICS_TRACKER = new InjectionToken<AnalyticsTracker>('fm.analytics.tracker', {
  providedIn: 'root',
  factory: () => ({ track: () => undefined }),
});
