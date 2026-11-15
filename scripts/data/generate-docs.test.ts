import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { REFERENCE_FILE, renderReference } from './generate-docs';

// ETE-39: the field reference is generated from the schemas; a schema change without
// `pnpm data:docs` fails here (and so in CI).
test(`${REFERENCE_FILE} matches the schemas (run pnpm data:docs if not)`, async () => {
  assert.equal(readFileSync(REFERENCE_FILE, 'utf8'), await renderReference(process.cwd()));
});

test('the reference covers every data file and its required fields', async () => {
  const md = await renderReference(process.cwd());
  for (const file of [
    'profile',
    'skills',
    'experience',
    'services',
    'projects',
    'contact',
    'resumes',
    'site',
    'clients',
  ]) {
    assert.match(md, new RegExp(`## \`${file}\\.json\``), file);
  }
  assert.match(md, /\| `ratio` +\| yes +\| number/);
});
