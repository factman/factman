/** The media query for visitors who ask for less motion. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * True when the visitor prefers reduced motion. Counters then show their final value, typing shows
 * the full text and reveals are instant (ETE-26). False on the server and in old browsers.
 */
export function prefersReducedMotion(win: Window | null | undefined = globalThis.window): boolean {
  return !!win?.matchMedia?.(REDUCED_MOTION_QUERY).matches;
}
