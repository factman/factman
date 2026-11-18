// Public API of the data layer: pure selectors. Only pages and core may import `@data`.
// Each data set has its own entry point (`@data/site`, `@data/services`, `@data/clients`) so a
// chunk only ever carries the JSON it imports: a barrel re-exporting every set would pull them all
// into the main bundle (ETE-41, checked by pnpm test:build).
export * from './selectors';
