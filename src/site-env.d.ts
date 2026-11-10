/**
 * The deployment this build targets, set at build time by angular.json `define`:
 * 'production' by default, 'preview' with `pnpm build:preview` (Vercel preview deployments).
 * Read it only in app.config.ts and hand it to `CoreModule.forRoot()`.
 */
declare const FM_SITE_ENV: 'production' | 'preview';
