// pnpm test:reports: the preview deployment comment on pull requests (ETE-240).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { JOBS, MARKER, previewComment, readCoverage, resultText } from './preview-comment.mjs';

const allPassed = Object.fromEntries(JOBS.map(([id]) => [id, 'success']));
const info = {
  url: 'https://factman-abc123-eteam-apps.vercel.app',
  sha: '0aa7074e1f2d3c4b5a6978877665544332211000',
  branch: 'factman60/ete-240-ci-comment',
  repository: 'factman/factman',
  runUrl: 'https://github.com/factman/factman/actions/runs/42',
  runNumber: 312,
  results: allPassed,
  coverage: {
    statements: { total: 3693, covered: 3588, pct: 97.15 },
    branches: { total: 1799, covered: 1704, pct: 94.71 },
    functions: { total: 571, covered: 543, pct: 95.09 },
    lines: { total: 2413, covered: 2371, pct: 98.25 },
  },
  deployedAt: new Date('2026-11-23T12:34:56.789Z'),
};

test('starts with the marker the job finds its comment by', () => {
  assert.ok(previewComment(info).startsWith(`${MARKER}\n## Preview deployment`));
});

test('links the preview, its tools, the commit and the run', () => {
  const md = previewComment(info);
  assert.match(
    md,
    /\*\*\[Open the preview\]\(https:\/\/factman-abc123-eteam-apps\.vercel\.app\)\*\*/,
  );
  assert.match(
    md,
    /\[`0aa7074`\]\(https:\/\/github\.com\/factman\/factman\/commit\/0aa7074e1f2d3c4b5a6978877665544332211000\)/,
  );
  assert.match(md, /on `factman60\/ete-240-ci-comment`/);
  for (const path of ['', '/storybook', '/coverage', '/playwright']) {
    assert.ok(md.includes(`| https://factman-abc123-eteam-apps.vercel.app${path} |`), path);
  }
  assert.match(
    md,
    /Deployed 2026-11-23 12:34 UTC by \[CI run #312\]\(https:\/\/github\.com\/factman\/factman\/actions\/runs\/42\)/,
  );
});

test('lists every job result and warns only when one did not pass', () => {
  const ok = previewComment(info);
  for (const [, name] of JOBS) assert.ok(ok.includes(`| ${name} | ✅ Passed |`), name);
  assert.doesNotMatch(ok, /\[!WARNING\]/);

  const md = previewComment({
    ...info,
    results: { ...allPassed, e2e: 'failure', build: 'cancelled' },
  });
  assert.ok(md.includes('| E2E (Playwright) | ❌ Failed |'));
  assert.ok(md.includes('| Build (prerender) | ⏹️ Cancelled |'));
  assert.match(
    md,
    /> Build \(prerender\), E2E \(Playwright\) did not pass\. The preview still deployed/,
  );
  assert.equal(resultText(''), '❔ Unknown');
});

test('shows the coverage totals, or says there are none', () => {
  assert.ok(
    previewComment(info).includes(
      '| 97.15% (3588 / 3693) | 94.71% (1704 / 1799) | 95.09% (543 / 571) | 98.25% (2371 / 2413) |',
    ),
  );
  assert.match(previewComment({ ...info, coverage: undefined }), /No coverage report for this run/);
});

test('publishes nothing private, and refuses anything but a deployment URL', () => {
  const md = previewComment(info);
  assert.doesNotMatch(md, /team_|prj_|token|VERCEL_/i);
  assert.throws(() => previewComment({ ...info, url: '' }), /not a deployment URL/);
  assert.throws(() => previewComment({ ...info, url: 'https://x.vercel.app/a) [b](c' }));
});

test('keeps a branch name from breaking the Markdown', () => {
  const md = previewComment({ ...info, branch: 'a|b`c' });
  assert.match(md, /on `a b c`/);
});

test('reads the coverage totals, and tolerates a missing or broken file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fm-cov-'));
  const file = join(dir, 'coverage-summary.json');
  writeFileSync(file, JSON.stringify({ total: info.coverage }));
  assert.deepEqual(readCoverage(file), info.coverage);
  writeFileSync(file, '{');
  assert.equal(readCoverage(file), undefined);
  assert.equal(readCoverage(join(dir, 'none.json')), undefined);
});
