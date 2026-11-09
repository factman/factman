import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { BUNDLE, COMPONENTS_DIR, GLOBAL, slug, splitBundle } from './split-components';

const sample = [
  '/* intro */',
  '.fm-backdrop { color: var(--text-primary); }',
  '/* ---------- Button ---------- */',
  '.fm-btn { color: red; }',
  '/* ---------- Shared: tones, glass, arrows ---------- */',
  '.fm-glass { opacity: 1; }',
  '/* ===== Portfolio: code & terminal UI ===== */',
  '.fm-window { display: flex; }',
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
  assert.deepEqual([...sections.keys()], ['button', 'portfolio-code-terminal-ui']);
  assert.match(sections.get('button') ?? '', /\.fm-btn/);
});

test('rejects duplicate sections', () => {
  assert.throws(
    () => splitBundle('/* ---------- A ---------- */\n/* ---------- A ---------- */'),
    /duplicate section "a"/,
  );
});

test('committed split matches bundle.css and keeps every line', () => {
  const { global, sections } = splitBundle(readFileSync(BUNDLE, 'utf8'));
  const strip = (css: string) => css.replace(/^\/\* Factman .*Do not edit\. \*\/\n/, '');
  assert.equal(strip(readFileSync(GLOBAL, 'utf8')), global, 'run pnpm ds:split');
  assert.deepEqual(
    readdirSync(COMPONENTS_DIR).sort(),
    [...sections.keys()].map((n) => `${n}.css`).sort(),
  );
  for (const [name, css] of sections)
    assert.equal(strip(readFileSync(`${COMPONENTS_DIR}/${name}.css`, 'utf8')), css, name);
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
