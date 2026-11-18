// CSP check: every inline script in the built pages is allowed by its hash, and the CSP lists no
// hash that the build no longer needs. The app and the static Storybook (ETE-220) are checked
// against their own vercel.json rules. Fix with: pnpm csp:hashes
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  APP_SOURCE,
  DIST,
  inlineScriptHashes,
  scriptSrc,
  STORYBOOK_DIR,
  STORYBOOK_SOURCE,
  storybookScriptExtras,
  storybookScriptHashes,
} from './inline-scripts.mjs';

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const scriptSrcOf = (source) =>
  vercel.headers
    .find((h) => h.source === source)
    .headers.find((h) => h.key === 'Content-Security-Policy')
    .value.split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith('script-src '));

test("the app CSP allows exactly the app's inline scripts (run pnpm csp:hashes if not)", () => {
  assert.equal(scriptSrcOf(APP_SOURCE), scriptSrc(inlineScriptHashes()));
});

test("the Storybook CSP allows exactly Storybook's inline scripts (run pnpm csp:hashes if not)", () => {
  assert.equal(
    scriptSrcOf(STORYBOOK_SOURCE),
    scriptSrc(storybookScriptHashes(), storybookScriptExtras),
  );
});

test('script-src never falls back to unsafe-inline or unsafe-eval', () => {
  assert.doesNotMatch(scriptSrcOf(APP_SOURCE), /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(scriptSrcOf(STORYBOOK_SOURCE), /unsafe-inline/);
});

test('the build ships the static Storybook at /storybook (ETE-220)', () => {
  const dir = join(DIST, STORYBOOK_DIR);
  for (const file of ['index.html', 'iframe.html', 'index.json']) {
    assert.ok(existsSync(join(dir, file)), `${dir}/${file} is missing`);
  }
  // Served without a trailing slash, so the manager resolves its relative URLs from a base.
  assert.match(readFileSync(join(dir, 'index.html'), 'utf8'), /<base href="\/storybook\/"/);
});
