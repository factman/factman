// ETE-259: there is no global reduced-motion reset, so every stylesheet of ours that moves
// something (keyframes, an animation, or a transform transition) must handle
// prefers-reduced-motion itself: opt in with `no-preference`, or turn it off under `reduce`.
// The vendored design-system CSS (src/styles/factman) is covered by src/styles/_reduced-motion.scss.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const SKIP = ['src/styles/factman', 'src/styles/generated'];

function stylesheets(dir: string): string[] {
  if (SKIP.includes(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return stylesheets(path);
    return /\.s?css$/.test(name) ? [path] : [];
  });
}

/** Whether a stylesheet moves anything: keyframes, a named animation, or a transform transition. */
export function moves(css: string): boolean {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  if (/@keyframes\s/.test(code)) return true;
  for (const [, value] of code.matchAll(/\banimation(?:-name)?\s*:\s*([^;]+)/g)) {
    if (!/^\s*none\s*$/.test(value)) return true;
  }
  for (const [, value] of code.matchAll(/\btransition(?:-property)?\s*:\s*([^;]+)/g)) {
    if (/\b(transform|translate|rotate|scale)\b/.test(value)) return true;
  }
  return false;
}

test('moves() spots keyframes, animations and transform transitions, not fades', () => {
  assert.equal(moves('.a { transition: transform var(--d) ease; }'), true);
  assert.equal(moves('.a { animation: spin 1s linear infinite; }'), true);
  assert.equal(moves('@keyframes spin { to { rotate: 1turn; } }'), true);
  assert.equal(moves('.a { transition: opacity var(--d) ease; animation: none; }'), false);
  assert.equal(moves('// transition: transform 1s\n.a { transition: none; }'), false);
});

test('every stylesheet that moves something handles prefers-reduced-motion', () => {
  const missing = [...stylesheets('src/app'), ...stylesheets('src/styles')].filter((file) => {
    const css = readFileSync(file, 'utf8');
    return moves(css) && !css.includes('prefers-reduced-motion');
  });
  assert.deepEqual(
    missing,
    [],
    'add a prefers-reduced-motion rule (docs/interaction-and-motion.md)',
  );
});
