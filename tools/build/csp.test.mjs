// CSP check: every inline script in the prerendered pages is allowed by its hash, and the CSP lists
// no hash that the build no longer needs. Fix with: pnpm csp:hashes
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { inlineScriptHashes, scriptSrc } from './inline-scripts.mjs';

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const csp = vercel.headers
  .flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy').value;
const directive = csp
  .split(';')
  .map((d) => d.trim())
  .find((d) => d.startsWith('script-src '));

test("the CSP allows exactly the build's inline scripts (run pnpm csp:hashes if not)", () => {
  assert.equal(directive, scriptSrc(inlineScriptHashes()));
});

test('script-src never falls back to unsafe-inline or unsafe-eval', () => {
  assert.doesNotMatch(directive, /unsafe-inline|unsafe-eval/);
});
