// The theme pre-paint script in src/index.html must pick the same theme as resolveTheme()
// (src/app/core/theme), so the first paint matches what ThemeService applies after hydration.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { resolveTheme, THEME_STORAGE_KEY } from '../../src/app/core/theme/resolve-theme';

const html = readFileSync('src/index.html', 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];

function run(
  stored: string | null | 'throws',
  dark: boolean | null,
): { theme: string | null; scheme: string | null } {
  let theme: string | null = null;
  let scheme: string | null = 'light dark';
  const localStorage = {
    getItem: (k: string) => {
      if (stored === 'throws') throw new Error('SecurityError');
      return k === THEME_STORAGE_KEY ? stored : null;
    },
  };
  const matchMedia = dark === null ? undefined : () => ({ matches: dark });
  const meta = { setAttribute: (_: string, v: string) => (scheme = v) };
  const document = {
    documentElement: { setAttribute: (_: string, v: string) => (theme = v) },
    // <meta name="color-scheme"> follows the theme (ETE-261).
    querySelector: (selector: string) => (selector === 'meta[name="color-scheme"]' ? meta : null),
  };
  new Function('localStorage', 'window', 'matchMedia', 'document', script!)(
    localStorage,
    { matchMedia },
    matchMedia,
    document,
  );
  return { theme, scheme };
}

test('index.html has the inline theme pre-paint script', () => {
  assert.ok(script?.includes(THEME_STORAGE_KEY));
});

for (const [stored, dark] of [
  ['light', true],
  ['dark', false],
  [null, true],
  [null, false],
  [null, null],
  ['purple', true],
  ['throws', true],
] as const) {
  test(`stored ${stored}, system dark ${dark}: same theme as resolveTheme()`, () => {
    const expected = resolveTheme(stored === 'throws' ? null : stored, dark, 'system');
    const { theme, scheme } = run(stored, dark);
    assert.equal(theme, expected);
    assert.equal(scheme, expected, 'meta color-scheme matches the theme');
  });
}
