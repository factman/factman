/**
 * RS suite, build layer (ETE-110, PRD §12 RS-08 to RS-14): checks the committed résumé PDFs in
 * public/resumes/ against the data. RS-01 to RS-07 live with the data and template tests; the UI,
 * integration and E2E cases with the organisms and in e2e/resume.spec.ts (see the README).
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { pathToFileURL } from 'node:url';

import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';

import type { ResumeSectionId } from '../../src/app/shared/resume/resume-view-model';

import { printResumes } from './build-resumes';
import { currentResumes } from './current';
import { MANIFEST_FILE, manifestProblems, type ResumeManifest, sha256 } from './manifest';
import { loadResumeSources } from './sources';
import { HEADINGS } from './template';

const manifest: ResumeManifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
const resumes = currentResumes();
const { contact } = loadResumeSources();
const pdfPath = (id: string) => `public${manifest.resumes.find((r) => r.id === id)!.file}`;

/** pdfjs, the copy pdf-to-img ships (no extra dependency). */
async function pdfjs() {
  const fromPdfToImg = createRequire(createRequire(import.meta.url).resolve('pdf-to-img'));
  return import(pathToFileURL(fromPdfToImg.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
}

/** A PDF's text, page by page, in reading order. */
export async function pdfText(path: string): Promise<string> {
  const { getDocument } = await pdfjs();
  const doc = await getDocument({ data: new Uint8Array(readFileSync(path)) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(content.items.map((item: { str?: string }) => item.str ?? '').join(' '));
  }
  return pages.join('\n').replace(/\s+/g, ' ');
}

const texts = new Map<string, string>();
const textOf = async (id: string) => {
  if (!texts.has(id)) texts.set(id, await pdfText(pdfPath(id)));
  return texts.get(id)!;
};

describe('RS-07: file names, URLs and the manifest entry', () => {
  for (const r of resumes) {
    test(r.id, () => {
      const entry = manifest.resumes.find((e) => e.id === r.id)!;
      assert.equal(r.fileName, `odunayo-mohammed-${r.vm.slug}.pdf`);
      assert.equal(entry.file, `/resumes/${r.fileName}`);
      assert.equal(entry.title, r.vm.title);
      assert.deepEqual(
        entry.previews,
        Array.from(
          { length: entry.previews.length },
          (_, i) => `/resumes/odunayo-mohammed-${r.vm.slug}-page-${i + 1}.webp`,
        ),
      );
    });
  }
});

describe('RS-08: one A4 PDF per résumé, within its pages and 250 KB', () => {
  for (const r of resumes) {
    test(r.id, async () => {
      const path = pdfPath(r.id);
      assert.ok(existsSync(path), `${path} is missing`);
      assert.ok(statSync(path).size <= 250 * 1024, `${path} is over 250 KB`);
      const doc = await PDFDocument.load(readFileSync(path));
      assert.ok(doc.getPageCount() <= r.pages.max, `${doc.getPageCount()} pages`);
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        assert.ok(
          Math.abs(width - 595.28) < 1 && Math.abs(height - 841.89) < 1,
          `${width} × ${height}`,
        );
      }
    });
  }
  test('no PDF for a résumé that is not in resumes.json', () => {
    assert.deepEqual(manifest.resumes.map((r) => r.id).sort(), resumes.map((r) => r.id).sort());
  });
});

describe('RS-09: the text extracts with the name, email and headings in order', () => {
  for (const r of resumes) {
    test(r.id, async () => {
      const text = await textOf(r.id);
      assert.ok(text.includes(r.vm.header.name), 'name');
      assert.ok(text.includes(contact.email), 'email');
      // Headings print in capitals (CSS); each appears, in the résumé's section order.
      let at = -1;
      const closing: ResumeSectionId[] = ['education', 'languages', 'publications'];
      const order = [
        ...r.vm.sections.filter((s) => !closing.includes(s)),
        ...closing.filter((s) => r.vm.sections.includes(s)),
      ];
      for (const id of order) {
        const heading = HEADINGS[id].toUpperCase();
        const found = text.search(new RegExp(`(^|[^A-Z])${heading}([^A-Z]|$)`));
        if (found < 0) continue; // an empty section is left out
        assert.ok(found > at, `${heading} is out of order`);
        at = found;
      }
      assert.ok(at > 0, 'no heading found');
    });

    test(`${r.id}: no placeholder, TODO or street; the phone only when allowed`, async () => {
      const text = await textOf(r.id);
      assert.doesNotMatch(text, /\[[^\]]+\]/, 'an unfilled [placeholder]');
      assert.doesNotMatch(text, /\bTODO\b/);
      assert.doesNotMatch(text, /\b(street|road|avenue|crescent|p\.?\s?o\.? box)\b,?\s+\w/i);
      const phone = contact.phone.replace(/\D/g, '').slice(-7);
      const digits = text.replace(/\D/g, '');
      assert.equal(
        digits.includes(phone),
        loadResumeSources().resumes.resumes.find((x) => x.id === r.id)!.showPhone,
        'the phone shows exactly when showPhone is true',
      );
    });
  }
});

describe('RS-10: fonts embedded, metadata set, tagged', () => {
  for (const r of resumes) {
    test(r.id, async () => {
      const bytes = readFileSync(pdfPath(r.id));
      const doc = await PDFDocument.load(bytes, { updateMetadata: false });
      assert.equal(doc.getTitle(), `${r.vm.header.name} · ${r.vm.title} résumé`);
      assert.equal(doc.getAuthor(), r.vm.header.name);
      assert.ok(doc.getSubject()?.includes(r.vm.title));
      assert.ok(doc.getKeywords()?.includes(r.vm.title));
      assert.ok(doc.getCreationDate() && doc.getModificationDate());
      assert.equal(doc.catalog.get(PDFName.of('Lang'))?.toString(), '(en)');
      assert.ok(doc.catalog.get(PDFName.of('StructTreeRoot')), 'not tagged (no structure tree)');
      const mark = doc.catalog.lookupMaybe(PDFName.of('MarkInfo'), PDFDict);
      assert.equal(mark?.get(PDFName.of('Marked'))?.toString(), 'true');
      const text = bytes.toString('latin1');
      for (const font of ['Carlito-Regular', 'Carlito-Bold', 'Caladea-Bold']) {
        assert.match(
          text,
          new RegExp(`/BaseFont\\s*/[A-Z]{6}\\+${font}\\b`),
          `${font} not embedded`,
        );
      }
      assert.match(text, /\/FontFile2/, 'no embedded font program');
    });
  }
});

describe('RS-11: variant-defining skills appear only where tagged', () => {
  const only = { Flutter: 'mobile', Kubernetes: 'devops' } as const;
  for (const [skill, id] of Object.entries(only)) {
    test(`${skill} only on ${id}`, async () => {
      for (const r of resumes) {
        assert.equal((await textOf(r.id)).includes(skill), r.id === id, `${skill} on ${r.id}`);
      }
    });
  }
});

describe('RS-12: previews and manifest', () => {
  for (const entry of manifest.resumes) {
    test(entry.id, () => {
      // Pages 1 and 2 are previewed (the build shows at most two).
      assert.equal(entry.previews.length, Math.min(entry.pages, 2));
      for (const preview of entry.previews) {
        const path = `public${preview}`;
        assert.match(readFileSync(path).subarray(8, 12).toString(), /WEBP/, `${path} is not WebP`);
        assert.ok(statSync(path).size <= 300 * 1024, `${path} is over 300 KB`);
      }
    });
  }
  test('the manifest matches the files on disk and the data', () => {
    const problems = manifestProblems(
      manifest,
      resumes,
      {
        exists: existsSync,
        stat: (p) =>
          existsSync(p) ? { sha256: sha256(readFileSync(p)), bytes: statSync(p).size } : undefined,
      },
      false,
    );
    assert.deepEqual(problems, []);
  });
});

describe('RS-14: two prints from the same data are identical', () => {
  test('same text and the same page images', { timeout: 120_000 }, async () => {
    const [a, b] = [mkdtempSync(join(tmpdir(), 'rs14-')), mkdtempSync(join(tmpdir(), 'rs14-'))];
    const first = await printResumes(a);
    const second = await printResumes(b);
    for (const r of first.manifest.resumes) {
      const name = r.file.split('/').at(-1)!;
      assert.equal(await pdfText(join(a, name)), await pdfText(join(b, name)), `${r.id} text`);
      for (const preview of r.previews) {
        const file = preview.split('/').at(-1)!;
        assert.equal(
          sha256(readFileSync(join(a, file))),
          sha256(readFileSync(join(b, file))),
          file,
        );
      }
    }
    assert.deepEqual(
      first.manifest.resumes.map((r) => r.sha256),
      second.manifest.resumes.map((r) => r.sha256),
      'the PDFs differ byte for byte',
    );
  });
});
