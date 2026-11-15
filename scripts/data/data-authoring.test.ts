import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import { SCHEMA_DIR } from './registry';

// ETE-39: every JSON example in docs/data-authoring.md, marked `<!-- example: <file> -->`, must be
// a valid record of that file, so copying an example never fails data:validate's schema check.
const guide = readFileSync('docs/data-authoring.md', 'utf8');
const examples = [...guide.matchAll(/<!-- example: ([a-z]+) -->\s*```json\n([\s\S]*?)```/g)].map(
  ([, file, json]) => ({ file, json }),
);

test('the guide has examples for projects, skills, experience and clients', () => {
  assert.deepEqual([...new Set(examples.map((e) => e.file))].sort(), [
    'clients',
    'experience',
    'projects',
    'skills',
  ]);
});

for (const [i, { file, json }] of examples.entries()) {
  test(`example ${i + 1} is a valid ${file}.json record`, () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, `${file}.schema.json`), 'utf8'));
    const validate = ajv.compile(schema);
    const ok = validate([JSON.parse(json)]);
    assert.ok(ok, JSON.stringify(validate.errors, null, 2));
  });
}
