// pnpm csp:hashes: writes the hash of every inline script in the build into the CSP script-src
// in vercel.json, so they run under script-src 'self' without 'unsafe-inline'. The app's pages
// and the static Storybook at /storybook (ETE-220) each get their own header rule and hashes.
// The production hosts' /storybook rule (ETE-236) gets the app's hashes, like every other path.
// Run it after a change adds or alters an inline script (Angular's event replay, the theme
// pre-paint script, a Storybook upgrade); pnpm test:build fails until you do. It reads the
// preview build, the only one that contains Storybook.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format } from 'prettier';

import {
  APP_SOURCE,
  DIST,
  headerRule,
  inlineScriptHashes,
  scriptSrc,
  STORYBOOK_DIR,
  STORYBOOK_SOURCE,
  storybookScriptHashes,
  storybookScriptExtras,
} from './inline-scripts.mjs';

if (!existsSync(join(DIST, STORYBOOK_DIR))) {
  console.error(
    'csp:hashes: no Storybook in the build; run it on the preview build (pnpm build:preview)',
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));

function setScriptSrc(rule, directive) {
  const csp = rule?.headers.find((h) => h.key === 'Content-Security-Policy');
  if (!csp) throw new Error(`vercel.json has no Content-Security-Policy for ${rule?.source}`);
  csp.value = csp.value.replace(/script-src [^;]*/, directive);
}

const app = inlineScriptHashes();
const storybook = storybookScriptHashes();
setScriptSrc(headerRule(config, APP_SOURCE), scriptSrc(app));
setScriptSrc(headerRule(config, STORYBOOK_SOURCE, { production: true }), scriptSrc(app));
setScriptSrc(headerRule(config, STORYBOOK_SOURCE), scriptSrc(storybook, storybookScriptExtras));

writeFileSync(
  'vercel.json',
  await format(JSON.stringify(config, null, 2), { parser: 'json', filepath: 'vercel.json' }),
);
console.log(
  `csp:hashes: ${app.size} app and ${storybook.size} Storybook inline script hashes in vercel.json`,
);
