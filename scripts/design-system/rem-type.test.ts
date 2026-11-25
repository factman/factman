import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pxToRem, remType } from './rem-type';

test('px to rem at a 16px root, exactly', () => {
  assert.equal(pxToRem(16), '1rem');
  assert.equal(pxToRem(13), '0.8125rem');
  assert.equal(pxToRem(11), '0.6875rem');
  assert.equal(pxToRem(0), '0');
});

test('rewrites font-size, line-height and the font shorthand, nothing else', () => {
  const css =
    '.a { font-size: 12px; line-height: 18px; padding: 8px 12px; }\n' +
    '.b { font: 600 13px/20px var(--font-sans); width: 340px; }\n' +
    '.c{font:400 14px/1.6 var(--font-sans);border:1px solid}';
  assert.equal(
    remType(css),
    '.a { font-size: 0.75rem; line-height: 1.125rem; padding: 8px 12px; }\n' +
      '.b { font: 600 0.8125rem/1.25rem var(--font-sans); width: 340px; }\n' +
      '.c{font:400 0.875rem/1.6 var(--font-sans);border:1px solid}',
  );
});

test('leaves font-family, font-weight and unitless or em values alone', () => {
  const css =
    '.a { font-family: var(--font-sans); font-weight: 600; font-size: 0.9em; line-height: 1.5; }';
  assert.equal(remType(css), css);
});
