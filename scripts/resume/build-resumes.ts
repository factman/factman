/**
 * `pnpm build:resumes` (ETE-108, FR-41, FR-42): prints each résumé to an A4 PDF with Playwright's
 * Chromium, sets its metadata with pdf-lib, renders page 1 (and 2) at 2x to WebP with pdf-to-img,
 * and writes them to public/resumes/ with resumes.manifest.json. The output is committed (the
 * owner's call, 24 Nov 2026): Vercel never needs Chromium, and every build checks it is current
 * (`pnpm resume:check`). Fails when a PDF has more pages than its résumé's `pages.max`.
 * `--out <dir>` writes somewhere else; with `--compare`, it then fails unless every résumé printed
 * to the same number of pages from the same HTML as the committed manifest says (CI proves the
 * generator works, and that what is committed is what it prints, without touching the repo).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { pdf as pdfToImages } from 'pdf-to-img';
import sharp from 'sharp';

import { currentResumes, type ResumeNow } from './current';
import { resumeFontCss } from './fonts';
import {
  MANIFEST_FILE,
  pageProblem,
  type ResumeManifest,
  type ResumeManifestEntry,
  RESUMES_DIR,
  RESUMES_URL,
  sha256,
} from './manifest';
import { renderResume } from './template';

/** A4's printable height with the 15 mm top and 16 mm bottom margins, in CSS px. */
const PAGE_HEIGHT_PX = ((297 - 15 - 16) * 96) / 25.4;
/** The printable width with 17 mm side margins, in CSS px. */
const PAGE_WIDTH_PX = ((210 - 17 * 2) * 96) / 25.4;
/** How many pages get a preview image. */
const PREVIEW_PAGES = 2;

/**
 * When Experience runs onto another page, starts that page with "Experience, continued": the
 * first organisation heading or job that crosses the page edge moves to the new page under the
 * label. Chromium has no CSS running elements, so this measures the print layout first.
 */
export async function markContinuedExperience(page: Page): Promise<number> {
  return page.evaluate(
    ({ pageHeight }) => {
      const doc = document.querySelector<HTMLElement>('.cv-doc');
      const section = document.querySelector<HTMLElement>('.cv-sec--experience');
      if (!doc || !section) return 0;
      const top = doc.getBoundingClientRect().top;
      let added = 0;
      for (let edge = pageHeight; ; edge += pageHeight) {
        const box = section.getBoundingClientRect();
        if (box.bottom - top <= edge) break;
        if (box.top - top >= edge) continue;
        const blocks = [...section.querySelectorAll<HTMLElement>('.cv-org__head, .cv-job')];
        const crossing = blocks.find((b) => b.getBoundingClientRect().bottom - top > edge);
        if (!crossing) break;
        const label = document.createElement('p');
        label.className = 'cv-h cv-continued';
        label.textContent = 'Experience, continued';
        // An organisation's first job moves with its heading.
        const anchor =
          crossing.classList.contains('cv-job') &&
          crossing.previousElementSibling?.classList.contains('cv-org__head')
            ? crossing.previousElementSibling
            : crossing;
        anchor.before(label);
        added++;
        // The label starts the next page; measure again from there.
        edge = label.getBoundingClientRect().top - top;
      }
      return added;
    },
    { pageHeight: PAGE_HEIGHT_PX },
  );
}

async function printResume(
  page: Page,
  html: string,
): Promise<{ pdf: Uint8Array; continued: number }> {
  await page.setViewportSize({ width: Math.round(PAGE_WIDTH_PX), height: 1200 });
  await page.emulateMedia({ media: 'print' });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const continued = await markContinuedExperience(page);
  // tagged: a structure tree, so screen readers and ATS read it in order (RS-10).
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
  return { pdf, continued };
}

/** Title, author, subject and keywords (FR-41), and fixed dates so a reprint of the same résumé is identical. */
export async function setMetadata(
  pdf: Uint8Array,
  resume: ResumeNow,
  keywords: string[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf);
  const { vm } = resume;
  doc.setTitle(`${vm.header.name} · ${vm.title} résumé`, { showInWindowTitleBar: true });
  doc.setAuthor(vm.header.name);
  doc.setSubject(`${vm.title} résumé of ${vm.header.name}`);
  doc.setKeywords(keywords);
  doc.setCreator('factman.dev résumé build (pnpm build:resumes)');
  doc.setProducer('Chromium, pdf-lib');
  doc.setLanguage('en');
  const fixed = new Date('2026-01-01T00:00:00Z');
  doc.setCreationDate(fixed);
  doc.setModificationDate(fixed);
  return doc.save({ useObjectStreams: false });
}

/** The keywords: the résumé's title and its skills, leaving out any with a placeholder in them. */
export function keywordsFor(resume: Pick<ResumeNow, 'vm'>): string[] {
  const skills = resume.vm.skillGroups
    .flatMap((g) => g.items)
    .filter((item) => item.every((segment) => segment.placeholder?.filled !== false))
    .map((item) =>
      item
        .map((segment) => segment.text)
        .join('')
        .trim(),
    );
  return [...new Set([resume.vm.title, ...skills])].filter(Boolean).slice(0, 40);
}

/** The card thumbnail's width in pixels: about twice the widest the card shows it (~340px). */
const THUMB_WIDTH = 680;

async function previews(pdf: Uint8Array, base: string, outDir: string): Promise<string[]> {
  const files: string[] = [];
  let n = 0;
  for await (const png of await pdfToImages(Buffer.from(pdf), { scale: 2 })) {
    if (++n > PREVIEW_PAGES) break;
    const name = `${base}-page-${n}.webp`;
    writeFileSync(join(outDir, name), await sharp(png).webp({ quality: 82 }).toBuffer());
    files.push(`${RESUMES_URL}/${name}`);
    // The résumé card's thumbnail: the first page at twice the card's width, not the full print
    // preview (ETE-126). The card finds it by name: resumeThumbnail() in the ResumeSection.
    if (n === 1) {
      const thumb = await sharp(png)
        .resize({ width: THUMB_WIDTH })
        .webp({ quality: 80 })
        .toBuffer();
      writeFileSync(join(outDir, `${base}-page-1-thumb.webp`), thumb);
    }
  }
  return files;
}

/** Where a fresh print differs from the committed one: pages, or the HTML it was printed from. */
export function compareManifests(committed: ResumeManifest, fresh: ResumeManifest): string[] {
  return fresh.resumes.flatMap((r) => {
    const c = committed.resumes.find((e) => e.id === r.id);
    if (!c) return [`${r.id}: not in the committed manifest`];
    return [
      ...(c.pages === r.pages ? [] : [`${r.id}: prints ${r.pages} page(s), committed ${c.pages}`]),
      ...(c.source === r.source ? [] : [`${r.id}: the committed PDF is from older HTML`]),
    ];
  });
}

/**
 * Prints every résumé into `outDir`: PDF, previews and manifest. Returns the manifest, and whether
 * a résumé went over its page maximum.
 */
export async function printResumes(
  outDir: string,
): Promise<{ manifest: ResumeManifest; failed: boolean }> {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const fonts = resumeFontCss();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const entries: ResumeManifestEntry[] = [];
  let failed = false;
  try {
    for (const resume of currentResumes()) {
      const printed = await printResume(page, renderResume(resume.vm, fonts));
      const pdf = await setMetadata(printed.pdf, resume, keywordsFor(resume));
      const pages = (await PDFDocument.load(pdf)).getPageCount();
      const problem = pageProblem(resume.id, pages, resume.pages);
      if (problem)
        console[problem.level === 'error' ? 'error' : 'warn'](`build:resumes: ${problem.message}`);
      if (problem?.level === 'error') failed = true;
      writeFileSync(join(outDir, resume.fileName), pdf);
      entries.push({
        id: resume.id,
        title: resume.vm.title,
        file: `${RESUMES_URL}/${resume.fileName}`,
        bytes: pdf.byteLength,
        sha256: sha256(pdf),
        pages,
        previews: await previews(pdf, resume.fileName.replace(/\.pdf$/, ''), outDir),
        source: resume.source,
        unfilled: resume.unfilled,
      });
      console.log(
        `build:resumes ${resume.id}: ${pages} page(s), ${Math.round(pdf.byteLength / 1024)} KB` +
          `${printed.continued ? ', Experience continued' : ''}` +
          `${resume.unfilled ? `, ${resume.unfilled} placeholder(s) unfilled` : ''}`,
      );
    }
  } finally {
    await browser.close();
  }
  const manifest: ResumeManifest = { version: 1, resumes: entries };
  const manifestPath =
    outDir === RESUMES_DIR ? MANIFEST_FILE : join(outDir, 'resumes.manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, failed };
}

async function main(): Promise<void> {
  const outAt = process.argv.indexOf('--out');
  const outDir = outAt > 0 ? process.argv[outAt + 1] : RESUMES_DIR;
  const printed = await printResumes(outDir);
  let failed = printed.failed;
  if (process.argv.includes('--compare')) {
    const committed: ResumeManifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
    for (const problem of compareManifests(committed, printed.manifest)) {
      console.error(`build:resumes: ${problem}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}

if (process.argv[1]?.endsWith('build-resumes.ts')) {
  main().catch((error: Error) => {
    console.error(`build:resumes: ${error.message}`);
    process.exit(1);
  });
}
