/**
 * DS suite (PRD section 12, ETE-38): data source structure tests DS-01 to DS-17.
 *
 * - DS-01: the shipped seed data passes every schema and rule.
 * - DS-14: generated TypeScript models are reproducible, so regenerating never changes them.
 * - DS-15: every file in ./fixtures breaks exactly one case and must fail for that case only.
 *
 * A fixture is either a rule fixture (`data`, run through the cross-file rules) or a file fixture
 * (`file` + `patch` or `raw`, applied to a copy of the real src/data and validated with the real
 * schemas). Run: pnpm test:scripts
 */
import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';

import { generateTypes } from './generate-types';
import { formatIssue, isError, type DsRule, type Issue } from './issues';
import { ASSETS_DIR, DATA_DIR } from './registry';
import { publicProjectLinks, runRules, type DataSet } from './rules';
import { validateData } from './validate';

const ROOT = process.cwd();
const FIXTURES = join(import.meta.dirname, 'fixtures');

type Patch =
  | { op: 'replace'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'copy'; from: string; path: string };

interface Fixture {
  rule: DsRule;
  case: string;
  /** Rule fixture: the data set, by file name. */
  data?: DataSet;
  /** Rule fixture: asset paths (relative to src/assets) that exist. Default: none. */
  assets?: string[];
  /** Rule fixture: pixel sizes of those assets, as [width, height]. */
  images?: Record<string, [number, number]>;
  /** File fixture: the data file to break, by name. */
  file?: string;
  patch?: Patch[];
  /** File fixture: replaces the file's text entirely (for invalid JSON). */
  raw?: string;
}

/** Every case that is a data rule. DS-14 and DS-15 are the tests in this file. */
const DATA_CASES: DsRule[] = [
  'DS-01',
  'DS-02',
  'DS-03',
  'DS-04',
  'DS-05',
  'DS-06',
  'DS-07',
  'DS-08',
  'DS-09',
  'DS-10',
  'DS-11',
  'DS-12',
  'DS-13',
  'DS-16',
  'DS-17',
];

const fixtures = readdirSync(FIXTURES)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => ({ name: f, ...(JSON.parse(readFileSync(join(FIXTURES, f), 'utf8')) as Fixture) }));

const temps: string[] = [];
after(() => temps.forEach((t) => rmSync(t, { recursive: true, force: true })));
const tempDir = (prefix: string) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
};

const segments = (pointer: string) =>
  pointer
    .split('/')
    .slice(1)
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

function getAt(doc: unknown, pointer: string): unknown {
  return segments(pointer).reduce<unknown>(
    (node, key) => (node as Record<string, unknown>)[key],
    doc,
  );
}

/** Applies JSON Patch–style operations (replace, remove, copy) in place. */
function applyPatch(doc: unknown, patch: Patch[]): void {
  for (const op of patch) {
    const keys = segments(op.path);
    const last = keys.pop()!;
    const parent = getAt(doc, keys.length ? `/${keys.join('/')}` : '') as Record<string, unknown>;
    if (op.op === 'remove') {
      if (Array.isArray(parent)) parent.splice(Number(last), 1);
      else delete parent[last];
    } else {
      parent[last] = op.op === 'copy' ? structuredClone(getAt(doc, op.from)) : op.value;
    }
  }
}

/** Runs one fixture and returns the problems it produced. */
function run(fx: Fixture): Issue[] {
  if (fx.data) {
    const assets = new Set(fx.assets ?? []);
    return runRules(fx.data, {
      assetExists: (p) => assets.has(p),
      imageSize: (p) => {
        const size = fx.images?.[p];
        return size && { width: size[0], height: size[1] };
      },
    });
  }
  // A copy of the real data and schemas, with the real assets linked in, and one file broken.
  const root = tempDir('ds-fixture-');
  cpSync(join(ROOT, DATA_DIR), join(root, DATA_DIR), { recursive: true });
  mkdirSync(join(root, 'src'), { recursive: true });
  symlinkSync(join(ROOT, ASSETS_DIR), join(root, ASSETS_DIR), 'dir');
  const target = join(root, DATA_DIR, `${fx.file}.json`);
  if (fx.raw !== undefined) {
    writeFileSync(target, fx.raw);
  } else {
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    applyPatch(doc, fx.patch ?? []);
    writeFileSync(target, JSON.stringify(doc));
  }
  return validateData(root).issues;
}

describe('DS-01: the shipped data', () => {
  test('passes every schema and rule', () => {
    const { issues, checked } = validateData(ROOT);
    const errors = issues.filter(isError);
    assert.deepEqual(errors.map(formatIssue), []);
    assert.ok(checked.length > 0, 'no data files were checked');
  });
});

describe('DS-15: negative fixtures fail for the expected reason only', () => {
  for (const fx of fixtures) {
    test(`${fx.rule} ${fx.name}: ${fx.case}`, () => {
      const errors = run(fx).filter(isError);
      assert.ok(errors.length > 0, `${fx.name} did not fail`);
      const other = errors.filter((i) => i.rule !== fx.rule);
      assert.deepEqual(
        other.map((i) => `[${i.rule ?? 'untagged'}] ${formatIssue(i)}`),
        [],
        `${fx.name} also failed for other reasons`,
      );
    });
  }

  test('every data case has at least one fixture', () => {
    const covered = new Set(fixtures.map((fx) => fx.rule));
    assert.deepEqual(
      DATA_CASES.filter((rule) => !covered.has(rule)),
      [],
    );
  });

  test('every fixture names a known case and exactly one kind of input', () => {
    for (const fx of fixtures) {
      assert.ok(DATA_CASES.includes(fx.rule), `${fx.name}: unknown rule ${fx.rule}`);
      assert.ok(!!fx.data !== !!fx.file, `${fx.name}: use either data or file`);
    }
  });
});

describe('DS-07: a public project with no link', () => {
  test('warns but does not fail', () => {
    const issues = publicProjectLinks({ projects: [{ id: 'shop', visibility: 'public' }] });
    assert.equal(issues.length, 1);
    assert.equal(issues[0].level, 'warning');
    assert.equal(issues[0].rule, 'DS-07');
    assert.deepEqual(
      publicProjectLinks({
        projects: [{ id: 'shop', visibility: 'public', links: { live: 'https://shop.dev' } }],
      }),
      [],
    );
  });
});

describe('DS-14: generated models are current', () => {
  test('regenerating from the same schemas produces identical files', async () => {
    const [a, b] = [tempDir('ds-types-a-'), tempDir('ds-types-b-')];
    const names = await generateTypes(ROOT, a);
    await generateTypes(ROOT, b);
    assert.ok(names.length > 0);
    for (const f of readdirSync(a)) {
      assert.equal(readFileSync(join(a, f), 'utf8'), readFileSync(join(b, f), 'utf8'), f);
    }
    assert.deepEqual(readdirSync(a).sort(), readdirSync(b).sort());
  });
});
