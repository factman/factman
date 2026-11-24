// ETE-26: only transform and opacity may animate. The stylelint config enforces it on transitions;
// this test pins the rule so a config change can't drop it silently. transition-property may also
// list display and overlay: discrete, they keep a top-layer element (dialog, popover) on screen
// while its opacity and transform animate out (ETE-252).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import stylelint from 'stylelint';

const lint = async (code: string) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: 'x.scss',
    configFile: '.stylelintrc.json',
  });
  return results[0].warnings.map((w) => w.rule);
};

test('transitions of transform and opacity are allowed', async () => {
  assert.deepEqual(
    await lint(
      '.a { transition: opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out); }\n.b { transition-property: transform; }\n.c { transition: none; }\n',
    ),
    [],
  );
});

test('display and overlay may join a transition-property list, for top-layer exits', async () => {
  assert.deepEqual(
    await lint('.a { transition-property: opacity, transform, display, overlay; }\n'),
    [],
  );
});

test('transitions of anything else are rejected', async () => {
  for (const css of [
    '.a { transition: all var(--duration-fast); }\n',
    '.a { transition: color var(--duration-fast); }\n',
    '.a { transition-property: width; }\n',
    '.a { transition: opacity var(--duration-fast), height var(--duration-fast); }\n',
  ]) {
    assert.ok((await lint(css)).includes('declaration-property-value-allowed-list'), css);
  }
});
