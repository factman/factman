// Publishes the prerendered not-found page as 404.html (ETE-88): the file Vercel and `serve`
// return, with a 404 status, for every address that has no page. Angular prerenders the page at
// /404 (404/index.html); this copies it over, so unknown addresses get the real page (styles,
// scripts, noindex), not a bare placeholder. Runs after `ng build` in build and build-preview.
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { DIST } from './inline-scripts.mjs';

const source = join(DIST, '404', 'index.html');
if (!existsSync(source)) {
  console.error(`not-found-page: ${source} is missing; is /404 still prerendered?`);
  process.exit(1);
}
copyFileSync(source, join(DIST, '404.html'));
console.log(`not-found-page: ${source} → ${join(DIST, '404.html')}`);
