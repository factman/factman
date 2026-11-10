// Copies the static Storybook build into the site output, so every deployment serves the UI kit
// at /storybook (ETE-220). Runs after `ng build`, which empties dist/factman first.
//
// Vercel serves /storybook without a trailing slash (trailingSlash: false), where the manager's
// relative URLs (./sb-manager/…, ./index.json, fonts) would resolve from the site root. A <base>
// first in <head> makes them resolve from /storybook/. storybook-static itself is left as built.
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DIST, STORYBOOK_BASE, STORYBOOK_DIR } from './inline-scripts.mjs';

const source = 'storybook-static';
if (!existsSync(join(source, 'index.html'))) {
  console.error(`add-storybook: ${source}/index.html is missing; run pnpm build-storybook first`);
  process.exit(1);
}
const target = join(DIST, STORYBOOK_DIR);
cpSync(source, target, { recursive: true });

const index = join(target, 'index.html');
const html = readFileSync(index, 'utf8');
if (!/<head>/.test(html)) {
  console.error(`add-storybook: no <head> in ${index}`);
  process.exit(1);
}
writeFileSync(index, html.replace('<head>', `<head>\n    <base href="${STORYBOOK_BASE}" />`));
console.log(`add-storybook: ${source} → ${target} (base ${STORYBOOK_BASE})`);
