// pnpm test:coverage, last step (ETE-237): one coverage report for the unit tests (ng test) and
// the Storybook story tests (Vitest browser mode), written to coverage/ as HTML, json-summary and
// a text summary.
//
// The two runners transform the sources differently (Angular's esbuild build and Vite), so the
// same file comes back with different statement maps, and Istanbul's own merge would add up the
// wrong statements. They are merged by source line instead: the unit run's map is the base (the
// story run's when only it loaded the file), and a statement, branch path or function counts as
// covered when either run covered code that starts on the same line.
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

export const RAW = { unit: 'coverage-raw/unit', storybook: 'coverage-raw/storybook' };
export const OUT = 'coverage';

const read = (dir) => {
  const file = join(dir, 'coverage-final.json');
  if (!existsSync(file)) throw new Error(`merge-coverage: ${file} is missing; run the tests first`);
  return JSON.parse(readFileSync(file, 'utf8'));
};

/** Lines that start code which ran at least once in this file's coverage. */
function coveredLines(file) {
  const lines = { s: new Set(), f: new Set(), b: new Map() };
  for (const [id, hits] of Object.entries(file.s)) {
    if (hits > 0) lines.s.add(file.statementMap[id].start.line);
  }
  for (const [id, hits] of Object.entries(file.f)) {
    if (hits > 0) lines.f.add((file.fnMap[id].decl ?? file.fnMap[id].loc).start.line);
  }
  for (const [id, paths] of Object.entries(file.b)) {
    const line = file.branchMap[id].loc?.start.line ?? file.branchMap[id].locations[0]?.start.line;
    const taken = lines.b.get(line) ?? [];
    paths.forEach((hits, i) => (taken[i] = (taken[i] ?? 0) + hits));
    lines.b.set(line, taken);
  }
  return lines;
}

/** `base` with every statement, function and branch path covered on `other`'s covered lines. */
export function mergeFile(base, other) {
  const merged = structuredClone(base);
  const lines = coveredLines(other);
  for (const id of Object.keys(merged.s)) {
    if (!merged.s[id] && lines.s.has(merged.statementMap[id].start.line)) merged.s[id] = 1;
  }
  for (const id of Object.keys(merged.f)) {
    const fn = merged.fnMap[id];
    if (!merged.f[id] && lines.f.has((fn.decl ?? fn.loc).start.line)) merged.f[id] = 1;
  }
  for (const id of Object.keys(merged.b)) {
    const branch = merged.branchMap[id];
    const taken = lines.b.get(branch.loc?.start.line ?? branch.locations[0]?.start.line);
    if (!taken) continue;
    merged.b[id] = merged.b[id].map((hits, i) => hits || (taken[i] > 0 ? 1 : 0));
  }
  return merged;
}

/** The merged coverage data, keyed by absolute file path. */
export function mergeCoverage(unit, storybook) {
  const merged = {};
  for (const path of new Set([...Object.keys(unit), ...Object.keys(storybook)])) {
    const a = unit[path];
    const b = storybook[path];
    merged[path] = a && b ? mergeFile(a, b) : structuredClone(a ?? b);
  }
  return merged;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const map = libCoverage.createCoverageMap(mergeCoverage(read(RAW.unit), read(RAW.storybook)));
  rmSync(OUT, { recursive: true, force: true });
  const context = libReport.createContext({
    dir: OUT,
    coverageMap: map,
    defaultSummarizer: 'nested',
    sourceFinder: (path) => readFileSync(path, 'utf8'),
  });
  for (const reporter of ['html', 'json-summary', 'text-summary']) {
    reports.create(reporter).execute(context);
  }
  console.log(`merge-coverage: ${Object.keys(map.data).length} files → ${OUT}/index.html`);
}
