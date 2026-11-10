// Public API of shared utilities. Import via `@shared`.
// Data models are generated from src/data/schemas by `pnpm data:types`.
export type * from './models/generated';
export * from './site/resolve-site';
export { SharedModule } from './shared.module';
