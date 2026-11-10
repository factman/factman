// Public API of shared utilities. Import via `@shared`.
// Data models are generated from src/data/schemas by `pnpm data:types`.
export type * from './models/generated';
export { prefersReducedMotion, REDUCED_MOTION_QUERY } from './motion/reduced-motion';
export { Reveal } from './motion/reveal.directive';
export { SharedModule } from './shared.module';
export * from './site/resolve-site';
export * from './time/clock';
export * from './time/year-month';
export * from './experience/experience';
export * from './experience/years';
export * from './experience/counters';
