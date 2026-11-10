// pnpm csp:hashes: writes the hash of every inline script in the build into the CSP script-src
// in vercel.json, so they run under script-src 'self' without 'unsafe-inline'. The app's pages
// and the static Storybook at /storybook (ETE-220) each get their own header rule and hashes.
// Run it after a change adds or alters an inline script (Angular's event replay, the theme
// pre-paint script, a Storybook upgrade); pnpm test:build fails until you do.
import { readFileSync, writeFileSync } from 'node:fs';
import { format } from 'prettier';

import {
  APP_SOURCE,
  inlineScriptHashes,
  scriptSrc,
  STORYBOOK_SOURCE,
  storybookScriptHashes,
  storybookScriptExtras,
} from './inline-scripts.mjs';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));

function setScriptSrc(source, directive) {
  const rule = config.headers.find((h) => h.source === source);
  const csp = rule?.headers.find((h) => h.key === 'Content-Security-Policy');
  if (!csp) throw new Error(`vercel.json has no Content-Security-Policy for ${source}`);
  csp.value = csp.value.replace(/script-src [^;]*/, directive);
}

const app = inlineScriptHashes();
const storybook = storybookScriptHashes();
setScriptSrc(APP_SOURCE, scriptSrc(app));
setScriptSrc(STORYBOOK_SOURCE, scriptSrc(storybook, storybookScriptExtras));

writeFileSync(
  'vercel.json',
  await format(JSON.stringify(config), { parser: 'json', filepath: 'vercel.json' }),
);
console.log(
  `csp:hashes: ${app.size} app and ${storybook.size} Storybook inline script hashes in vercel.json`,
);
