// pnpm test:reports: the line-based coverage merge (ETE-237).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeCoverage, mergeFile } from './merge-coverage.mjs';

const at = (line) => ({ start: { line, column: 0 }, end: { line, column: 10 } });

/** A file's coverage with one statement and one function per line, and one two-path branch. */
function file(path, lines, { hits = 0, branch = [0, 0] } = {}) {
  const ids = lines.map((_, i) => String(i));
  return {
    path,
    statementMap: Object.fromEntries(ids.map((id, i) => [id, at(lines[i])])),
    s: Object.fromEntries(ids.map((id) => [id, hits])),
    fnMap: Object.fromEntries(
      ids.map((id, i) => [
        id,
        { name: `f${i}`, decl: at(lines[i]), loc: at(lines[i]), line: lines[i] },
      ]),
    ),
    f: Object.fromEntries(ids.map((id) => [id, hits])),
    branchMap: {
      0: { loc: at(lines[0]), type: 'if', locations: [at(lines[0]), at(lines[0])], line: lines[0] },
    },
    b: { 0: branch },
  };
}

test('code covered by the other run, on the same line, counts as covered', () => {
  const unit = file('/a.ts', [1, 2, 3]);
  const storybook = { ...file('/a.ts', [2, 9], { hits: 3, branch: [0, 1] }) };
  storybook.statementMap['0'] = at(2);
  storybook.branchMap['0'].loc = at(1);
  const merged = mergeFile(unit, storybook);
  assert.deepEqual(merged.s, { 0: 0, 1: 1, 2: 0 });
  assert.deepEqual(merged.f, { 0: 0, 1: 1, 2: 0 });
  assert.deepEqual(merged.b, { 0: [0, 1] });
});

test("the base run's own hits are kept, and the inputs are not changed", () => {
  const unit = file('/a.ts', [1, 2], { hits: 5, branch: [2, 0] });
  const before = structuredClone(unit);
  const merged = mergeFile(unit, file('/a.ts', [7]));
  assert.deepEqual(merged.s, { 0: 5, 1: 5 });
  assert.deepEqual(merged.b, { 0: [2, 0] });
  assert.deepEqual(unit, before);
});

test('files only one run loaded are kept as they are', () => {
  const merged = mergeCoverage(
    { '/u.ts': file('/u.ts', [1]) },
    { '/s.ts': file('/s.ts', [4], { hits: 1 }) },
  );
  assert.deepEqual(Object.keys(merged).sort(), ['/s.ts', '/u.ts']);
  assert.deepEqual(merged['/s.ts'].s, { 0: 1 });
});
