/**
 * The résumé downloads' manifest (ETE-108, FR-41, FR-42): what `pnpm build:resumes` wrote to
 * public/resumes/, and the checks every build runs on it (`pnpm resume:check`).
 */
import { createHash } from 'node:crypto';

export const RESUMES_DIR = 'public/resumes';
export const MANIFEST_FILE = `${RESUMES_DIR}/resumes.manifest.json`;
/** The URL path the site serves public/resumes/ at. */
export const RESUMES_URL = '/resumes';

export interface ResumeManifestEntry {
  id: string;
  title: string;
  /** The PDF's URL path, `/resumes/<fileName>`. */
  file: string;
  bytes: number;
  sha256: string;
  pages: number;
  /** Page 1 (and 2) as WebP at 2x, URL paths. */
  previews: string[];
  /** sha256 of the résumé's HTML when it was printed: a mismatch means the data changed since. */
  source: string;
  /** Placeholders still unfilled when it was printed. */
  unfilled: number;
}

export interface ResumeManifest {
  version: 1;
  resumes: ResumeManifestEntry[];
}

export const sha256 = (data: string | Uint8Array): string =>
  createHash('sha256').update(data).digest('hex');

/** The page check: over `max` fails; over `target` is only a warning. */
export function pageProblem(
  id: string,
  pages: number,
  limits: { target: number; max: number },
): { level: 'error' | 'warning'; message: string } | undefined {
  if (pages > limits.max) {
    return {
      level: 'error',
      message: `${id}: ${pages} pages, more than the maximum of ${limits.max}`,
    };
  }
  if (pages > limits.target) {
    return {
      level: 'warning',
      message: `${id}: ${pages} pages, over the target of ${limits.target}`,
    };
  }
  return undefined;
}

/** What the check needs to know about one résumé now, from the data. */
export interface CurrentResume {
  id: string;
  fileName: string;
  pages: { target: number; max: number };
  /** sha256 of its HTML now. */
  source: string;
  unfilled: number;
}

/** What the check finds on disk for a manifest entry. */
export interface FileFacts {
  exists(path: string): boolean;
  /** sha256 and size of a file under public/. */
  stat(path: string): { sha256: string; bytes: number } | undefined;
}

/**
 * Every problem with the committed downloads: a résumé missing from the manifest, a missing or
 * changed file, too many pages, a stale print (the data changed since), and, for a production
 * build, unfilled placeholders (PRD RS-09; the owner's call, 24 Nov 2026).
 */
export function manifestProblems(
  manifest: ResumeManifest | undefined,
  current: readonly CurrentResume[],
  files: FileFacts,
  production: boolean,
): string[] {
  if (!manifest) return [`${MANIFEST_FILE} is missing: run pnpm build:resumes`];
  const problems: string[] = [];
  for (const resume of current) {
    const entry = manifest.resumes.find((r) => r.id === resume.id);
    if (!entry) {
      problems.push(`${resume.id}: not in the manifest`);
      continue;
    }
    if (entry.file !== `${RESUMES_URL}/${resume.fileName}`) {
      problems.push(
        `${resume.id}: the manifest names ${entry.file}, not ${RESUMES_URL}/${resume.fileName}`,
      );
    }
    const pdf = files.stat(`public${entry.file}`);
    if (!pdf) problems.push(`${resume.id}: ${entry.file} is missing`);
    else if (pdf.sha256 !== entry.sha256 || pdf.bytes !== entry.bytes) {
      problems.push(`${resume.id}: ${entry.file} does not match the manifest`);
    }
    if (entry.previews.length === 0) problems.push(`${resume.id}: no preview image`);
    for (const preview of entry.previews) {
      if (!files.exists(`public${preview}`)) problems.push(`${resume.id}: ${preview} is missing`);
    }
    const pages = pageProblem(resume.id, entry.pages, resume.pages);
    if (pages?.level === 'error') problems.push(pages.message);
    if (entry.source !== resume.source) {
      problems.push(`${resume.id}: the résumé changed since its PDF was printed`);
    }
    if (production && resume.unfilled > 0) {
      problems.push(`${resume.id}: ${resume.unfilled} placeholder(s) still unfilled (production)`);
    }
  }
  const unknown = manifest.resumes.filter((r) => !current.some((c) => c.id === r.id));
  for (const r of unknown) problems.push(`${r.id}: in the manifest but not in resumes.json`);
  return problems;
}
