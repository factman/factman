// Inline <script> elements in the built pages and their CSP hashes.
// Shared by the csp:hashes generator and the test:build check. The app and the static Storybook
// (dist/…/storybook, ETE-220) are hashed separately, so Storybook never loosens the app's CSP.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const DIST = 'dist/factman/browser';
export const STORYBOOK_DIR = 'storybook';
export const STORYBOOK_BASE = `/${STORYBOOK_DIR}/`;

/** vercel.json header sources: every path but the tool paths gets the app's policy. */
export const APP_SOURCE = '/((?!(?:storybook|coverage|playwright)(?:/|$)).*)';
export const STORYBOOK_SOURCE = '/storybook/:path*';
/** The test reports on previews (ETE-237): coverage at /coverage, Playwright at /playwright. */
export const REPORTS_SOURCE = '/:report(coverage|playwright)/:path*';
/** On the production hosts every tool path gets the app's CSP: it is a plain 404 there. */
export const TOOLS_SOURCE = '/:tool(storybook|coverage|playwright)/:path*';
/** Folders the preview build may have and the production build must not. */
export const TOOL_DIRS = ['storybook', 'coverage', 'playwright'];

/**
 * Storybook ships only in the preview build (ETE-236). vercel.json headers cannot see the
 * environment, so the Storybook rule is scoped by host: the production domains (factman.dev and
 * www.factman.dev) are `missing` from it, and a second rule gives /storybook there the app's own
 * CSP, so the 404 page production serves at that path keeps the strict policy.
 */
export const PRODUCTION_HOST = { type: 'host', value: { suf: 'factman.dev' } };

const isProductionHost = (c) =>
  c.type === PRODUCTION_HOST.type && c.value?.suf === PRODUCTION_HOST.value.suf;

/**
 * The vercel.json header rule for a source: the production-host rule when `production` is true,
 * otherwise the rule that is not limited to the production hosts.
 */
export function headerRule(config, source, { production = false } = {}) {
  return config.headers.find(
    (h) => h.source === source && (h.has ?? []).some(isProductionHost) === production,
  );
}

/** The build variant tools/build checks: `production` (no Storybook) or `preview`. */
export const BUILD_VARIANT = process.env['BUILD_VARIANT'] ?? 'preview';

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

/** `'sha256-…'` source for each distinct executable inline script in the app's pages (not tools). */
export function inlineScriptHashes(dist = DIST) {
  return hashScripts(htmlFiles(dist, TOOL_DIRS), dist);
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
