// Inline <script> elements in the built pages and their CSP hashes.
// Shared by the csp:hashes generator and the test:build check. The app and the static Storybook
// (dist/…/storybook, ETE-220) are hashed separately, so Storybook never loosens the app's CSP.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const DIST = 'dist/factman/browser';
export const STORYBOOK_DIR = 'storybook';
export const STORYBOOK_BASE = `/${STORYBOOK_DIR}/`;

/** vercel.json header sources: every path but /storybook gets the app's policy. */
export const APP_SOURCE = '/((?!storybook(?:/|$)).*)';
export const STORYBOOK_SOURCE = '/storybook/:path*';

function htmlFiles(dir, skip = []) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return skip.includes(name) ? [] : htmlFiles(p);
    return name.endsWith('.html') ? [p] : [];
  });
}

function hashScripts(files, base) {
  const hashes = new Map();
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type="application\/(ld\+)?json"/.test(m[1])) continue; // data, not executed
      const source = `'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`;
      hashes.set(source, [...(hashes.get(source) ?? []), relative(base, file)]);
    }
  }
  return hashes;
}

/** `'sha256-…'` source for each distinct executable inline script in the app's pages. */
export function inlineScriptHashes(dist = DIST) {
  return hashScripts(htmlFiles(dist, [STORYBOOK_DIR]), dist);
}

/** The same for the static Storybook; empty when it isn't in the build. */
export function storybookScriptHashes(dist = DIST) {
  const dir = join(dist, STORYBOOK_DIR);
  return existsSync(dir) ? hashScripts(htmlFiles(dir), dir) : new Map();
}

/** The `script-src` directive for these hashes, plus any extra sources. */
export const scriptSrc = (hashes, extra = []) =>
  ["script-src 'self'", ...extra, ...[...hashes.keys()].sort()].join(' ');

/**
 * Sources Storybook needs beyond its inline-script hashes. Storybook's Angular renderer compiles
 * stories just in time (it reads the component metadata that only JIT keeps), and the JIT compiler
 * uses eval. Allowed on /storybook only; the app's rule never gets it (tools/build/csp.test.mjs).
 * e2e/storybook.spec.ts fails with the blocked source if a Storybook upgrade needs more.
 */
export const storybookScriptExtras = ["'unsafe-eval'"];
