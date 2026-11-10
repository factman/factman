// Public API of the data layer: typed content from src/data/*.json and pure selectors.
// Only pages and core may import `@data`; pages normally go through `@core/data` repositories.
export { clients } from './clients';
export * from './selectors';
export { services } from './services';
export { site } from './site';
