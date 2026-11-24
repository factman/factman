/**
 * `pnpm resume:check [--production]` (ETE-108): every build runs this before `ng build`. It fails
 * when the committed downloads in public/resumes/ don't match the data (run `pnpm build:resumes`),
 * when a PDF has more pages than its résumé allows, and, with --production (Vercel's production
 * build, also set by VERCEL_ENV=production), while any placeholder is still unfilled.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';

import { currentResumes } from './current';
import { MANIFEST_FILE, manifestProblems, type ResumeManifest, sha256 } from './manifest';

const production =
  process.argv.includes('--production') || process.env['VERCEL_ENV'] === 'production';
const manifest: ResumeManifest | undefined = existsSync(MANIFEST_FILE)
  ? JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'))
  : undefined;
const problems = manifestProblems(
  manifest,
  currentResumes(),
  {
    exists: existsSync,
    stat: (path) =>
      existsSync(path)
        ? { sha256: sha256(readFileSync(path)), bytes: statSync(path).size }
        : undefined,
  },
  production,
);

if (problems.length) {
  console.error(`resume:check: ${problems.length} problem(s)${production ? ' (production)' : ''}`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('Run pnpm build:resumes after changing the data, then commit public/resumes/.');
  process.exit(1);
}
console.log(`resume:check: ${manifest!.resumes.length} résumés match the data`);
