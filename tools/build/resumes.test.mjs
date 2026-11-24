// Résumé downloads (ETE-108): the committed PDFs and previews in public/resumes/ ship with the
// site at /resumes/, as resumes.manifest.json lists them. Run with: pnpm test:build
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { DIST } from './inline-scripts.mjs';

const manifest = JSON.parse(readFileSync(join(DIST, 'resumes/resumes.manifest.json'), 'utf8'));

test('every résumé in the manifest ships its PDF and previews', () => {
  assert.ok(manifest.resumes.length > 0, 'the manifest lists no résumés');
  for (const r of manifest.resumes) {
    for (const path of [r.file, ...r.previews]) {
      assert.ok(existsSync(join(DIST, path)), `${path} is not in the build`);
    }
    const pdf = readFileSync(join(DIST, r.file));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', `${r.file} is not a PDF`);
    assert.equal(pdf.length, r.bytes, `${r.file} differs from the manifest`);
  }
});
