import { InjectionToken } from '@angular/core';

/** Returns "now". Injected so date logic is deterministic in tests (ETE-42). */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

/**
 * The app's clock. Pages are prerendered, so values computed from it (years of experience,
 * "Present" durations) are fixed at build time and refreshed by the next deploy.
 * Tests provide `{ provide: CLOCK, useValue: () => new Date('2026-11-10') }`.
 */
export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => systemClock,
});
