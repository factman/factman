import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { BUNDLE, COMPONENTS_DIR, GLOBAL, slug, splitBundle } from './split-components';
import { remType } from './rem-type';

const sample = [
  '/* intro */',
  '.fm-backdrop { color: var(--text-primary); }',
  '/* ---------- Button ---------- */',
  '.fm-btn { color: red; }',
  '/* ---------- Shared: tones, glass, arrows ---------- */',
  '.fm-glass { opacity: 1; }',
  '/* ===== Portfolio: code & terminal UI ===== */',
  '.fm-window { display: flex; }',
  '/* ===== Portfolio: sections ===== */',
  '.fm-reveal { opacity: 0; }',
  '.fm-reveal.is-in { opacity: 1; }',
  '.fm-eyebrow { color: var(--accent-default); }',
  '@media (prefers-reduced-motion: reduce) {',
  '  .fm-reveal { opacity: 1; }',
  '}',
].join('\n');

test('slugifies section titles', () => {
  assert.equal(slug('Spinner & Loader'), 'spinner-loader');
  assert.equal(slug('Portfolio: code & terminal UI'), 'portfolio-code-terminal-ui');
});

test('preamble and shared helpers go global; each component gets its own file', () => {
  const { global, sections } = splitBundle(sample);
  assert.match(global, /\.fm-backdrop/);
  assert.match(global, /\.fm-glass/);
  assert.doesNotMatch(global, /\.fm-btn/);
  assert.deepEqual(
    [...sections.keys()],
    ['button', 'portfolio-code-terminal-ui', 'portfolio-sections'],
  );
  assert.match(sections.get('button') ?? '', /\.fm-btn/);
});

test('lifts the top-level .fm-reveal rules into global.css for the fmReveal directive', () => {
  const { global, sections } = splitBundle(sample);
  assert.match(global, /^\.fm-reveal \{ opacity: 0; \}$/m);
  assert.match(global, /^\.fm-reveal\.is-in \{ opacity: 1; \}$/m);
  const rest = sections.get('portfolio-sections') ?? '';
  assert.doesNotMatch(rest, /^\.fm-reveal/m);
  assert.match(rest, /^ {2}\.fm-reveal \{ opacity: 1; \}$/m); // nested media rule stays
  assert.match(rest, /\.fm-eyebrow/);
});

test('rejects duplicate sections', () => {
  assert.throws(
    () => splitBundle('/* ---------- A ---------- */\n/* ---------- A ---------- */'),
    /duplicate section "a"/,
  );
});

test('committed split matches bundle.css (type sizes in rem) and keeps every line', () => {
  const { global, sections } = splitBundle(readFileSync(BUNDLE, 'utf8'));
  // ds:split writes type sizes in rem (ETE-263).
  const strip = (css: string) => css.replace(/^\/\* Factman .*Do not edit\. \*\/\n/, '');
  assert.equal(strip(readFileSync(GLOBAL, 'utf8')), remType(global), 'run pnpm ds:split');
  assert.deepEqual(
    readdirSync(COMPONENTS_DIR).sort(),
    [...sections.keys()].map((n) => `${n}.css`).sort(),
  );
  for (const [name, css] of sections)
    assert.equal(strip(readFileSync(`${COMPONENTS_DIR}/${name}.css`, 'utf8')), remType(css), name);
  const lines = (s: string) =>
    s
      .split('\n')
      .filter((l) => l.trim())
      .sort();
  assert.deepEqual(
    lines([global, ...sections.values()].join('\n')),
    lines(readFileSync(BUNDLE, 'utf8')),
  );
});

test('the committed split has no px type sizes (ETE-263)', () => {
  const files = [GLOBAL, ...readdirSync(COMPONENTS_DIR).map((f) => `${COMPONENTS_DIR}/${f}`)];
  const px = /(?:^|[\s;{])(?:font-size|line-height|font)\s*:[^;}]*\d+px/;
  assert.deepEqual(
    files.filter((f) => px.test(readFileSync(f, 'utf8'))),
    [],
    'run pnpm ds:split',
  );
});
