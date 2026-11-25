// Public API of shared utilities. Import via `@shared`.
// Data models are generated from src/data/schemas by `pnpm data:types`.
export type * from './models/generated';
export * from './analytics';
export * from './media/portrait-sources';
export { prefersReducedMotion, REDUCED_MOTION_QUERY } from './motion/reduced-motion';
export { Reveal } from './motion/reveal.directive';
export { AnchorScroller } from './navigation/anchor-scroller';
export { pageTransition, samePage } from './navigation/page-transition';
export { SCROLL_SPY_ENABLED, ScrollSpy } from './navigation/scroll-spy';
export { SharedModule } from './shared.module';
export * from './terminal/terminal';
export * from './site/resolve-site';
export * from './time/clock';
export * from './time/year-month';
export * from './experience/experience';
export * from './experience/years';
export * from './experience/counters';
export * from './resume/resume-text';
export * from './resume/resume-view-model';
export * from './resume/resume-download';
export * from './blog/medium-feed';
export * from './github/contributions';
export { countWord } from './text/count-word';
