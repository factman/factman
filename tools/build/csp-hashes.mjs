// pnpm csp:hashes: writes the hash of every inline script in the build into the CSP script-src
// in vercel.json, so they run under script-src 'self' without 'unsafe-inline'. Run it after a
// change adds or alters an inline script (Angular's event replay, the theme pre-paint script);
// pnpm test:build fails until you do.
import { readFileSync, writeFileSync } from 'node:fs';

import { inlineScriptHashes, scriptSrc } from './inline-scripts.mjs';

const hashes = inlineScriptHashes();
const raw = readFileSync('vercel.json', 'utf8');
const next = raw.replace(/script-src [^;]*/, scriptSrc(hashes));
writeFileSync('vercel.json', next);
console.log(`csp:hashes: ${hashes.size} inline script hashes in vercel.json script-src`);
