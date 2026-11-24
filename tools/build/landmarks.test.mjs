// Landmark check on the prerendered pages (ETE-262): every page has exactly one <main>, one
// id="main" and one skip link, so the app shell and a page template never both add them.
// index.csr.html is the client-only shell (never prerendered), and the tool folders (Storybook,
// coverage, the Playwright report) aren't the site. Runs in pnpm test:build.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { DIST, TOOL_DIRS } from './inline-scripts.mjs';

/** Every prerendered page in the build, outside the tool folders. */
function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return TOOL_DIRS.includes(name) ? [] : pages(path);
    return name.endsWith('.html') && name !== 'index.csr.html' ? [path] : [];
  });
}

const count = (html, pattern) => (html.match(pattern) ?? []).length;

test('every prerendered page has one main landmark, one #main and one skip link', () => {
  const files = pages(DIST);
  assert.ok(files.length > 5, `only ${files.length} pages found in ${DIST}`);
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const page = relative(DIST, file);
    assert.equal(count(html, /<main[\s>]/g), 1, `${page}: <main> elements`);
    assert.equal(count(html, /\srole="main"/g), 0, `${page}: role="main"`);
    assert.equal(count(html, /\sid="main"/g), 1, `${page}: id="main"`);
    assert.equal(count(html, /class="skip-link"/g), 1, `${page}: skip links`);
  }
});
