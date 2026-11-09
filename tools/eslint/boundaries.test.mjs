// Proves the Atomic Design lint rules fail on intentional violations.
// Run: pnpm test:lint-rules
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { ESLint } from 'eslint';

const root = join(import.meta.dirname, 'fixtures');
const eslint = new ESLint({ ignore: false });

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : [],
  );

const files = walk(root);
const violations = files.filter((f) => f.includes('violation-'));
const valid = files.filter((f) => !f.includes('violation-'));

const expectedRule = (file) =>
  /level-tag/.test(file) ? 'atomic/level-tag' : 'boundaries/dependencies';

test('there are violation fixtures for every rule', () => {
  assert.ok(violations.length >= 9, `found ${violations.length}`);
});

for (const file of violations) {
  test(`fails: ${relative(root, file)}`, async () => {
    const [result] = await eslint.lintFiles([file]);
    const rules = result.messages.filter((m) => m.severity === 2).map((m) => m.ruleId);
    assert.ok(
      rules.includes(expectedRule(file)),
      `expected ${expectedRule(file)}, got ${JSON.stringify(result.messages)}`,
    );
  });
}

for (const file of valid) {
  test(`passes: ${relative(root, file)}`, async () => {
    const [result] = await eslint.lintFiles([file]);
    const errors = result.messages.filter((m) => m.severity === 2);
    assert.deepEqual(errors, [], JSON.stringify(errors, null, 2));
  });
}
