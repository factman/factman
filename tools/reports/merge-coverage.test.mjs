// pnpm test:reports: the line-based coverage merge (ETE-237) and the deployable report (ETE-239).
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';

import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

import { cleanUrlLinkMapper, mergeCoverage, mergeFile } from './merge-coverage.mjs';

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

// The deployable report (/coverage on previews): Vercel serves it with clean URLs and no trailing
// slash, so every link must be an absolute clean URL that resolves to a file in the report.

const node = (name, summary = false) => ({
  getQualifiedName: () => name,
  isSummary: () => summary,
});

test('the clean-URL mapper keeps the file layout and links by absolute clean URL', () => {
  const m = cleanUrlLinkMapper('/coverage');
  assert.equal(m.getPath(node('', true)), 'index.html');
  assert.equal(m.getPath(node('app/ui', true)), 'app/ui/index.html');
  assert.equal(m.getPath(node('app/app.ts')), 'app/app.ts.html');
  // `app.html.html` would lose both extensions to clean URLs.
  assert.equal(m.getPath(node('app/app.html')), 'app/app.html.page.html');
  assert.equal(m.relativePath(node('app/app.ts'), node('', true)), '/coverage');
  assert.equal(m.relativePath(node('', true), node('app/ui', true)), '/coverage/app/ui');
  assert.equal(m.relativePath(node('', true), node('app/app.ts')), '/coverage/app/app.ts');
  assert.equal(m.relativePath(node('', true), node('app/app.html')), '/coverage/app/app.html.page');
  assert.equal(m.assetPath(node('app/app.ts'), 'base.css'), '/coverage/base.css');
});

/** Every file under `dir`, relative to it. */
const walk = (dir, base = dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), base) : [relative(base, join(dir, e.name))],
  );

/** The file Vercel serves for a URL under clean URLs, or undefined (a 404). */
function served(dir, url, base) {
  const path = url.slice(base.length).replace(/^\//, '');
  const candidates = path ? [path, `${path}.html`, `${path}/index.html`] : ['index.html'];
  // A request ending in .html is redirected to the URL without it, so it never serves directly.
  return candidates
    .filter((c) => !(c === path && path.endsWith('.html')))
    .find((c) => existsSync(join(dir, c)) && !c.endsWith('/'));
}

test('every link and asset in the deployable report resolves under clean URLs', () => {
  const root = mkdtempSync(join(tmpdir(), 'fm-coverage-'));
  const sources = [
    'src/app/app.ts',
    'src/app/app.html',
    'src/app/ui/button.ts',
    'src/data/site.ts',
  ];
  const data = {};
  for (const source of sources) {
    const path = join(root, source);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, 'export const a = 1;\nexport const b = 2;\nexport const c = 3;\n');
    data[path] = file(path, [1, 2, 3], { hits: 1, branch: [1, 0] });
  }
  const dir = join(root, 'deploy');
  const context = libReport.createContext({
    dir,
    coverageMap: libCoverage.createCoverageMap(data),
    defaultSummarizer: 'nested',
    sourceFinder: (path) => readFileSync(path, 'utf8'),
  });
  reports.create('html', { linkMapper: cleanUrlLinkMapper('/coverage') }).execute(context);

  const files = walk(dir);
  assert.ok(files.includes('index.html'));
  assert.ok(files.some((f) => f.endsWith('app.html.page.html')));
  assert.deepEqual(
    files.filter((f) => f.endsWith('.html.html')),
    [],
  );

  const links = new Set();
  for (const page of files.filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dir, page), 'utf8');
    for (const [, url] of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) links.add(url);
    for (const [, url] of html.matchAll(/url\(([^)]+)\)/g)) links.add(url);
  }
  const local = [...links].filter((u) => !/^(#|https?:|javascript:|mailto:)/.test(u));
  assert.ok(local.length > 5);
  for (const url of local) {
    assert.ok(url.startsWith('/coverage'), `${url} is relative`);
    assert.ok(served(dir, url, '/coverage'), `${url} would be a 404`);
  }
});
