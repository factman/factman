import type { Resume } from '../models/generated';

/** One entry of public/resumes/resumes.manifest.json, as `pnpm build:resumes` writes it. */
export interface ResumeManifestFile {
  id: string;
  file: string;
  bytes: number;
  pages: number;
  previews: readonly string[];
}

/**
 * A downloadable résumé as the site shows it (FR-43 to FR-46): resumes.json's title, scope and icon,
 * with the committed PDF's URL, size, page count and page images from the manifest.
 */
export interface ResumeDownload {
  slug: string;
  title: string;
  scope: string;
  icon: string;
  fileName: string;
  /** The PDF's URL, `/resumes/<fileName>`. */
  file: string;
  /** "63 KB". */
  size: string;
  pages: number;
  /** Each page as an image, page 1 first. */
  previews: readonly string[];
  /** "Nov 2026": when the profile was last updated. */
  updated: string;
  /** The résumé's portrait (resumes.json `photo`), as the card's avatar. */
  photo?: string;
}

const MONTH = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * The résumés with a committed PDF, in resumes.json's order. A résumé the manifest doesn't list
 * (not printed yet) is left out rather than offered without a file.
 */
export function resumeDownloads(
  resumes: readonly Pick<
    Resume,
    'id' | 'slug' | 'title' | 'scope' | 'icon' | 'fileName' | 'photo'
  >[],
  manifest: readonly ResumeManifestFile[],
  updatedAt: string,
): ResumeDownload[] {
  const updated = MONTH.format(Date.parse(`${updatedAt.slice(0, 10)}T00:00:00Z`));
  return resumes.flatMap((r) => {
    const m = manifest.find((e) => e.id === r.id);
    if (!m) return [];
    return [
      {
        slug: r.slug,
        title: r.title,
        scope: r.scope,
        icon: r.icon,
        fileName: r.fileName,
        file: m.file,
        size: `${Math.max(1, Math.round(m.bytes / 1024))} KB`,
        pages: m.pages,
        previews: m.previews,
        updated,
        // The smallest export (pnpm ds:portraits): the avatar is 56px.
        ...(r.photo && { photo: `/assets/${r.photo.src.replace(/\.[a-z]+$/, '')}-360.webp` }),
      },
    ];
  });
}
