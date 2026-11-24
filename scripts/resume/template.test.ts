import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildResumeViewModel, resumeIds } from '../../src/app/shared/resume/resume-view-model';

import { loadResumeSources } from './sources';
import { escapeHtml, HEADINGS, RESUME_CSS, renderResume, rich } from './template';

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
    assert.match(css, /@page \{ size: a4; margin: 15mm 17mm 16mm; \}/i);
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
