// Unit tests for the supply-chain checks (ETE-130). Run: node --test "tools/security/*.test.mjs"
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { licenceAllowed, missingIntegrity } from './supply-chain.mjs';

test('permissive licences pass, copyleft ones do not', () => {
  for (const ok of ['MIT', 'ISC', 'Apache-2.0', 'BSD-3-Clause', '0BSD'])
    assert.ok(licenceAllowed(ok), ok);
  for (const no of ['GPL-3.0', 'AGPL-3.0-only', 'LGPL-3.0-or-later', 'SSPL-1.0', 'UNKNOWN'])
    assert.ok(!licenceAllowed(no), no);
});

test('an OR expression needs one allowed branch; an AND expression needs all', () => {
  assert.ok(licenceAllowed('(MIT OR GPL-3.0)'));
  assert.ok(licenceAllowed('(BSD-2-Clause OR MIT OR Apache-2.0)'));
  assert.ok(!licenceAllowed('(MIT AND GPL-3.0)'));
  assert.ok(licenceAllowed('(Apache-2.0 AND BSD-3-Clause)'));
});

test('lockfile entries without an integrity hash are reported', () => {
  const lock = [
    '  a@1.0.0:',
    '    resolution: {integrity: sha512-abc}',
    '  b@1.0.0:',
    '    resolution: {tarball: https://example.com/b.tgz}',
  ].join('\n');
  assert.deepEqual(missingIntegrity(lock), ['resolution: {tarball: https://example.com/b.tgz}']);
});
