// Inline <script> elements in the prerendered pages and their CSP hashes.
// Shared by the csp:hashes generator and the test:build check.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const DIST = 'dist/factman/browser';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return name.endsWith('.html') ? [p] : [];
  });
}

/** `'sha256-…'` source for each distinct executable inline script, with the pages using it. */
export function inlineScriptHashes(dist = DIST) {
  const hashes = new Map();
  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type="application\/(ld\+)?json"/.test(m[1])) continue; // data, not executed
      const source = `'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`;
      hashes.set(source, [...(hashes.get(source) ?? []), file.slice(dist.length + 1)]);
    }
  }
  return hashes;
}

/** The `script-src` directive for these hashes. */
export const scriptSrc = (hashes) => ["script-src 'self'", ...[...hashes.keys()].sort()].join(' ');
