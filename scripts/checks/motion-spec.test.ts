/**
 * ETE-197: docs/interaction-and-motion.md names design tokens for durations, curves, spacing and
 * states. Every one must exist in the vendored tokens.css, so the spec can't point at a token
 * that was renamed or removed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const SPEC = 'docs/interaction-and-motion.md';
const TOKENS = 'src/styles/factman/tokens.css';

test('every token the motion spec names exists in tokens.css', () => {
  const spec = readFileSync(SPEC, 'utf8');
  const defined = new Set(
    [...readFileSync(TOKENS, 'utf8').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );
  // Tokens inside inline code spans; `split--wide` (a class modifier) is not a token.
  const code = [...spec.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  const named = [
    ...new Set(
      code.flatMap((c) => [...c.matchAll(/(?<![\w-])(--[a-z][a-z0-9-]*)/g)].map((m) => m[1])),
    ),
  ];
  assert.ok(named.length > 10, 'expected the spec to name tokens');
  assert.deepEqual(
    named.filter((t) => !defined.has(t)),
    [],
  );
});
