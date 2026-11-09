import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildFonts, FONTS, unicodeRange, withPreload } from './build-fonts';

test('reads the unicode-range of one subset from the package CSS', () => {
  const css =
    '/* x-latin-ext */\n@font-face { unicode-range: U+0100-02BA; }\n/* x-latin */\n@font-face { unicode-range: U+0000-00FF; }';
  assert.equal(unicodeRange(css, 'x-latin'), 'U+0000-00FF');
  assert.equal(unicodeRange(css, 'x-latin-ext'), 'U+0100-02BA');
  assert.throws(() => unicodeRange(css, 'x-greek'), /no unicode-range/);
});

test('adds or replaces the preload block in index.html', () => {
  const html = '<html>\n  <head>\n    <title>x</title>\n  </head>\n</html>';
  const once = withPreload(html, '<link a />');
  assert.match(
    once,
    /<!-- fonts:preload \(pnpm ds:fonts\) -->\n {4}<link a \/>\n {4}<!-- \/fonts:preload -->\n {2}<\/head>/,
  );
  assert.equal(withPreload(once, '<link b />').match(/fonts:preload \(/g)?.length, 1);
  assert.match(withPreload(once, '<link b />'), /<link b \/>/);
});

test('generates self-hosted faces, swap, fallbacks and tokens; preloads only the critical file', () => {
  const { css, assets, preload } = buildFonts(process.cwd());
  assert.doesNotMatch(css, /googleapis|gstatic/);
  assert.equal((css.match(/font-display: swap;/g) ?? []).length, FONTS.length * 2);
  assert.match(
    css,
    /src: url\("\/assets\/fonts\/plus-jakarta-sans-latin-v[\d.]+\.woff2"\) format\("woff2"\);/,
  );
  assert.match(css, /font-family: "Plus Jakarta Sans Fallback";[\s\S]*size-adjust:/);
  assert.match(css, /--font-sans: "Plus Jakarta Sans", "Plus Jakarta Sans Fallback",/);
  assert.match(css, /--font-logo: Jost, "Jost Fallback",/);
  assert.equal(assets.size, 6);
  assert.equal(preload.match(/rel="preload"/g)?.length, 1);
  assert.match(preload, /plus-jakarta-sans-latin-v/);
});
