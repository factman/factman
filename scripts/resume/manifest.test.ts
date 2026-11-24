import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, test } from 'node:test';

import { compareManifests, keywordsFor } from './build-resumes';
import { currentResumes } from './current';
import {
  type CurrentResume,
  type FileFacts,
  MANIFEST_FILE,
  manifestProblems,
  pageProblem,
  type ResumeManifest,
  sha256,
} from './manifest';

const current: CurrentResume = {
  id: 'fullstack',
  fileName: 'cv.pdf',
  pages: { target: 2, max: 3 },
  source: 'abc',
  unfilled: 0,
};
const entry = {
  id: 'fullstack',
  title: 'Fullstack',
  file: '/resumes/cv.pdf',
  bytes: 10,
  sha256: 'pdfhash',
  pages: 2,
  previews: ['/resumes/cv-page-1.webp'],
  source: 'abc',
  unfilled: 0,
};
const manifest: ResumeManifest = { version: 1, resumes: [entry] };
const files = (over: Partial<FileFacts> = {}): FileFacts => ({
  exists: () => true,
  stat: () => ({ sha256: 'pdfhash', bytes: 10 }),
  ...over,
});

describe('pageProblem', () => {
  test('fails over the maximum, warns over the target', () => {
    assert.equal(pageProblem('a', 2, { target: 2, max: 3 }), undefined);
    assert.equal(pageProblem('a', 3, { target: 2, max: 3 })?.level, 'warning');
    assert.equal(pageProblem('a', 4, { target: 2, max: 3 })?.level, 'error');
  });
});

describe('manifestProblems (resume:check)', () => {
  test('passes when the downloads match the data', () => {
    assert.deepEqual(manifestProblems(manifest, [current], files(), false), []);
  });

  test('fails without a manifest, or with a résumé missing from it', () => {
    assert.match(
      manifestProblems(undefined, [current], files(), false)[0],
      /missing: run pnpm build:resumes/,
    );
    assert.deepEqual(manifestProblems({ version: 1, resumes: [] }, [current], files(), false), [
      'fullstack: not in the manifest',
    ]);
  });

  test('fails on a missing or changed PDF, a missing preview, or too many pages', () => {
    assert.match(
      manifestProblems(manifest, [current], files({ stat: () => undefined }), false)[0],
      /is missing/,
    );
    assert.match(
      manifestProblems(
        manifest,
        [current],
        files({ stat: () => ({ sha256: 'x', bytes: 10 }) }),
        false,
      )[0],
      /does not match the manifest/,
    );
    assert.match(
      manifestProblems(manifest, [current], files({ exists: () => false }), false)[0],
      /webp is missing/,
    );
    const long = { ...manifest, resumes: [{ ...entry, pages: 4 }] };
    assert.match(
      manifestProblems(long, [current], files(), false)[0],
      /more than the maximum of 3/,
    );
  });

  test('fails when the résumé changed since it was printed', () => {
    assert.deepEqual(manifestProblems(manifest, [{ ...current, source: 'new' }], files(), false), [
      'fullstack: the résumé changed since its PDF was printed',
    ]);
  });

  test('allows unfilled placeholders in a preview build, not in production', () => {
    const draft = { ...current, unfilled: 2 };
    assert.deepEqual(manifestProblems(manifest, [draft], files(), false), []);
    assert.deepEqual(manifestProblems(manifest, [draft], files(), true), [
      'fullstack: 2 placeholder(s) still unfilled (production)',
    ]);
  });

  test('flags a résumé in the manifest that resumes.json no longer has', () => {
    const extra = { ...manifest, resumes: [entry, { ...entry, id: 'old' }] };
    assert.deepEqual(manifestProblems(extra, [current], files(), false), [
      'old: in the manifest but not in resumes.json',
    ]);
  });
});

describe('compareManifests (build:resumes --compare in CI)', () => {
  test('reports a different page count or source', () => {
    const fresh = { ...manifest, resumes: [{ ...entry, pages: 3, source: 'new' }] };
    assert.deepEqual(compareManifests(manifest, fresh), [
      'fullstack: prints 3 page(s), committed 2',
      'fullstack: the committed PDF is from older HTML',
    ]);
    assert.deepEqual(compareManifests(manifest, manifest), []);
  });
});

describe('keywordsFor', () => {
  test('is the title and the skills, leaving out unfilled placeholders', () => {
    const vm = {
      title: 'Fullstack',
      skillGroups: [
        {
          label: 'Languages',
          items: [
            [{ text: 'TypeScript' }],
            [{ text: '[N]', placeholder: { token: '[N]', filled: false } }],
          ],
        },
      ],
    };
    assert.deepEqual(keywordsFor({ vm } as never), ['Fullstack', 'TypeScript']);
  });
});

describe('the committed downloads (public/resumes/)', () => {
  test('match the data: run pnpm build:resumes after changing it', () => {
    const committed: ResumeManifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
    const problems = manifestProblems(
      committed,
      currentResumes(),
      {
        exists: existsSync,
        stat: (path) =>
          existsSync(path)
            ? { sha256: sha256(readFileSync(path)), bytes: statSync(path).size }
            : undefined,
      },
      false,
    );
    assert.deepEqual(problems, []);
  });
});
