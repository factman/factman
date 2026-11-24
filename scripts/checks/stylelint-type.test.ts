// ETE-263: type sizes are rem so text follows the visitor's text size. The stylelint config
// rejects px in font-size, line-height and the font shorthand; this test pins the rule.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import stylelint from 'stylelint';

const lint = async (code: string) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: 'x.scss',
    configFile: '.stylelintrc.json',
  });
  // Only this rule's two checks: the token rule (declaration-strict-value) is tested elsewhere.
  return results[0].warnings
    .map((w) => w.rule)
    .filter((r) => r.startsWith('declaration-property-'));
};

test('rem, unitless and em type sizes are allowed', async () => {
  assert.deepEqual(
    await lint(
      '.a { font-size: 0.75rem; line-height: 1.5; }\n.b { font: 600 0.8125rem/1.25rem var(--font-sans); }\n.c { font-size: 0.9em; }\n',
    ),
    [],
  );
});

test('px type sizes are rejected', async () => {
  for (const css of [
    '.a { font-size: 12px; }\n',
    '.a { line-height: 18px; }\n',
    '.a { font: 600 13px/20px var(--font-sans); }\n',
  ]) {
    const rules = await lint(css);
    assert.ok(
      rules.includes('declaration-property-unit-disallowed-list') ||
        rules.includes('declaration-property-value-disallowed-list'),
      css,
    );
  }
});
