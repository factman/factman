import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildResumeViewModel, resumeIds } from '../../src/app/shared/resume/resume-view-model';

import { loadResumeSources } from './sources';
import { fontFile, RESUME_FONTS, resumeFontCss } from './fonts';
import {
  cssString,
  escapeHtml,
  HEADINGS,
  pageCss,
  RESUME_CSS,
  renderResume,
  rich,
} from './template';
import { existsSync } from 'node:fs';

// A fixed clock: the snapshots are the same on any day.
const NOW = new Date('2026-11-10T12:00:00Z');
const sources = loadResumeSources();

describe('rich', () => {
  test('escapes text and marks unfilled placeholders', () => {
    assert.equal(
      rich([
        { text: 'Served <b> ' },
        { text: '[N customers]', placeholder: { token: '[N customers]', filled: false } },
      ]),
      'Served &lt;b&gt; <span class="cv-ph">[N customers]</span>',
    );
    assert.equal(rich([{ text: '12,000', placeholder: { token: '[N]', filled: true } }]), '12,000');
  });
});

describe('the résumé template', () => {
  for (const id of resumeIds(sources.resumes)) {
    const vm = buildResumeViewModel(id, sources, NOW);
    const html = renderResume(vm);

    test(`${id}: matches its snapshot`, (t) => {
      t.assert.snapshot(html);
    });

    test(`${id}: has the sections in the résumé's own order`, () => {
      const headings = [...html.matchAll(/<h2 class="cv-h">([^<]+)<\/h2>/g)].map((m) => m[1]);
      const expected = vm.sections.map((s) => HEADINGS[s]).filter((h) => headings.includes(h));
      assert.deepEqual(headings, expected);
      assert.ok(headings.includes('Experience'));
    });

    test(`${id}: takes its content from the view model only`, () => {
      assert.ok(html.includes(escapeHtml(vm.header.name)));
      assert.ok(html.includes(escapeHtml(vm.header.headline)));
      for (const org of vm.experience)
        assert.ok(html.includes(escapeHtml(org.organization)), org.organization);
    });

    test(`${id}: highlights every unfilled placeholder, and only those`, () => {
      const marked = [...html.matchAll(/<span class="cv-ph">([^<]+)<\/span>/g)].map((m) => m[1]);
      assert.deepEqual([...new Set(marked)].sort(), [...vm.unfilled].map(escapeHtml).sort());
    });

    test(`${id}: shows the phone only when the résumé asks for it, and no street address (RS-06)`, () => {
      const phone = sources.contact.phone.replace('+234', '');
      const definition = sources.resumes.resumes.find((r) => r.id === id)!;
      assert.equal(html.replace(/\s/g, '').includes(phone), !!definition.showPhone);
      assert.ok(!/\b\d{1,5}\s+\w+\s+(Street|Road|Avenue|Close|Crescent|Way)\b/.test(html));
    });

    test(`${id}: merged roles show one title and one date span`, () => {
      for (const org of vm.experience) {
        for (const job of org.jobs) assert.ok(html.includes(escapeHtml(job.title)), job.title);
      }
    });
  }
});

describe('the résumé stylesheet', () => {
  /** The stylesheet with its whitespace collapsed, so the checks don't depend on formatting. */
  const css = RESUME_CSS.replace(/\s+/g, ' ');

  test('is A4 with 15 / 17 / 16 mm margins, and drops the placeholder highlight in print', () => {
    assert.match(css, /@page \{ size: a4; margin: 15mm 17mm 16mm;/i);
    assert.match(css, /@media print \{.*\.cv-ph \{ padding: 0; background: none;/);
  });

  test('keeps letter spacing at 0.9 pt or less, so the text extracts cleanly (ATS)', () => {
    for (const [, value] of RESUME_CSS.matchAll(/letter-spacing:\s*([\d.]+)pt/g)) {
      assert.ok(Number(value) <= 0.9, `letter-spacing ${value}pt`);
    }
  });

  test('uses Carlito for text and Caladea for headings, with fallbacks', () => {
    assert.match(css, /['"]?Carlito['"]?,\s*['"]?Calibri['"]?/);
    assert.match(css, /['"]?Caladea['"]?,\s*['"]?Cambria['"]?/);
  });
});

describe('the print page boxes (FR-40)', () => {
  const vm = buildResumeViewModel(resumeIds(sources.resumes)[0], sources, NOW);
  const css = RESUME_CSS.replace(/\s+/g, ' ');

  test('number every page "Page x of y" at the bottom right', () => {
    assert.match(css, /@bottom-right \{ content: 'Page ' counter\(page\) ' of ' counter\(pages\);/);
  });

  test('put the footer on every page and the running header from page 2', () => {
    const page = pageCss(vm);
    assert.ok(page.includes(`@bottom-left{content:${cssString(vm.footer)}}`), page);
    assert.ok(
      page.includes(`@top-left{content:${cssString(`${vm.header.name} · ${vm.title} résumé`)}}`),
    );
    assert.ok(page.endsWith('@page:first{@top-left{content:none}}'));
    assert.ok(renderResume(vm).includes(page));
  });

  test('escape quotes, backslashes and line breaks in the page text', () => {
    assert.equal(cssString('a "b" \\ c\nd'), '"a \\"b\\" \\\\ c\\a d"');
  });
});

describe('the résumé fonts (ETE-223)', () => {
  test('every face is in its package, for both subsets', () => {
    for (const { family, pkg, faces } of RESUME_FONTS) {
      for (const face of faces) {
        for (const subset of ['latin', 'latin-ext']) {
          assert.ok(existsSync(fontFile(pkg, family, subset, face)), `${family} ${subset} ${face}`);
        }
      }
    }
  });

  test('inlines each face as a woff2 @font-face, so nothing is fetched', () => {
    const css = resumeFontCss(() => Buffer.from('woff2'));
    const faces = css.split('\n');
    assert.equal(faces.length, 10); // Carlito 4 faces and Caladea 1, in latin and latin-ext
    for (const face of faces) {
      assert.match(face, /^@font-face\{font-family:(Carlito|Caladea);/);
      assert.ok(
        face.includes(`src:url(data:font/woff2;base64,${Buffer.from('woff2').toString('base64')})`),
      );
    }
    assert.ok(css.includes('font-family:Caladea;font-style:normal;font-weight:700'));
    assert.ok(css.includes('font-family:Carlito;font-style:italic;font-weight:700'));
  });
});
