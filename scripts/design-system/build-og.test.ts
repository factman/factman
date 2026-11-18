import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { checkOg, defaultContent, renderOgHtml } from './build-og';

describe('ds:og (ETE-198)', () => {
  test('fills the card from the data files', () => {
    const content = defaultContent(process.cwd(), new Date('2026-11-15T00:00:00Z'));
    assert.deepEqual(content, {
      name: 'Odunayo Mohammed',
      headline: 'Fullstack Software Engineer and CTO',
      meta: 'Lagos, Nigeria · 13+ years',
      url: 'factman.dev',
      portrait: 'src/assets/profile/odunayo-hero.webp',
    });
  });

  test('renders self-contained HTML with escaped text and an optional eyebrow', () => {
    const html = renderOgHtml(process.cwd(), {
      ...defaultContent(process.cwd()),
      name: 'A & B <C>',
      eyebrow: 'Services',
    });
    assert.match(html, /A &amp; B &lt;C&gt;/);
    assert.match(html, /class="eyebrow">Services</);
    assert.doesNotMatch(html, /(src|url)\((?!data:)|src="(?!data:)/);
  });

  test('the default image is in the repo at 1200 × 630 (run pnpm ds:og if not)', () => {
    assert.deepEqual(checkOg(process.cwd()), []);
  });
});
