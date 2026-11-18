/**
 * True when the visitor asks for less motion. Atoms can't import `@shared` (docs/atomic-design.md),
 * so this mirrors shared/motion/reduced-motion.ts. False on the server.
 */
export function reducedMotion(win: Window | null | undefined): boolean {
  return !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
