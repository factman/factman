import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buildTokensCss, OUTPUT, SOURCE } from './build-tokens';

const sample = {
  name: 'Sample',
  color: {
    tokens: [
      { name: 'blue-600', value: '#0b4c9e' },
      { name: 'bg-inverse', value: { light: '{blue-600}', dark: '{blue-400}' } },
      { name: 'terminal-bg', value: { light: '#070b14', dark: '#070b14' } },
      { name: 'legacy-primary-600', value: '#0b4c9e' },
    ],
  },
  radius: { tokens: [{ name: 'radius-md', value: '12px' }] },
  type: { families: { sans: '"Plus Jakarta Sans", sans-serif' } },
};

test('light values on :root, references become var()', () => {
  const css = buildTokensCss(sample);
  assert.match(css, /:root \{\n {2}--blue-600: #0b4c9e;\n {2}--bg-inverse: var\(--blue-600\);/);
  assert.match(css, /--radius-md: 12px;/);
  assert.match(css, /--font-sans: "Plus Jakarta Sans", sans-serif;/);
});

test('leaves out the legacy-* palette', () => {
  assert.doesNotMatch(buildTokensCss(sample), /legacy-/);
});

test('dark block only overrides tokens whose dark value differs', () => {
  const dark = buildTokensCss(sample).split('[data-theme="dark"] {')[1];
  assert.match(dark, /--bg-inverse: var\(--blue-400\);/);
  assert.doesNotMatch(dark, /terminal-bg/);
  assert.match(dark, /color-scheme: dark;/);
});

test('committed tokens.css matches the committed tokens.json', () => {
  const generated = buildTokensCss(JSON.parse(readFileSync(SOURCE, 'utf8')));
  assert.equal(readFileSync(OUTPUT, 'utf8'), generated, 'run pnpm ds:tokens');
});

test('nothing in the component bundle uses the excluded legacy-* tokens', () => {
  const bundle = readFileSync('src/styles/factman/bundle.css', 'utf8');
  assert.deepEqual(bundle.match(/var\(--legacy-[a-z0-9-]+/g) ?? [], []);
});
