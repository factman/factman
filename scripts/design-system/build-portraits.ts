/**
 * `pnpm ds:portraits` (ETE-198): responsive exports of the profile photos for `srcset` (ETE-91).
 * Sources are the photos named in src/data/profile.json (`photo`, `aboutPhoto`, `contactPhoto`),
 * the approved canvas images. Each is exported at half, three-quarters and full width, as AVIF and
 * WebP, next to the source: `odunayo-hero.webp` → `odunayo-hero-360.avif`, `odunayo-hero-360.webp`, …
 * Never enlarged: the full width is the source's own width.
 * `pnpm ds:portraits --check` fails when an export is missing or has the wrong size.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { readImageSize } from '../data/image-size';

export const PROFILE_FILE = 'src/data/profile.json';
export const ASSETS_DIR = 'src/assets';
export const PHOTO_KEYS = ['photo', 'aboutPhoto', 'contactPhoto'] as const;
export const FORMATS = ['avif', 'webp'] as const;
/** Fractions of the source width to export; 1 is the source width itself. */
export const STEPS = [0.5, 0.75, 1] as const;

interface Photo {
  src: string;
  width: number;
  height: number;
}

export interface PortraitExport {
  /** Path relative to the repository root. */
  path: string;
  source: string;
  width: number;
  height: number;
  format: (typeof FORMATS)[number];
}

/** Even widths for each step, so every export divides cleanly at 2x. */
export const widthsFor = (sourceWidth: number): number[] => [
  ...new Set(STEPS.map((s) => Math.round((sourceWidth * s) / 2) * 2)),
];

/** Every export the profile photos need, derived from profile.json. */
export function plannedExports(root: string): PortraitExport[] {
  const profile = JSON.parse(readFileSync(join(root, PROFILE_FILE), 'utf8')) as Record<
    string,
    unknown
  >;
  return PHOTO_KEYS.flatMap((key) => {
    const photo = profile[key] as Photo | undefined;
    if (!photo) return [];
    const source = join(ASSETS_DIR, photo.src);
    const base = source.replace(/\.[a-z]+$/, '');
    return widthsFor(photo.width).flatMap((width) =>
      FORMATS.map((format) => ({
        path: `${base}-${width}.${format}`,
        source,
        width,
        height: Math.round((photo.height * width) / photo.width),
        format,
      })),
    );
  });
}

/** Problems with the exports on disk; empty when all are present at the right size. */
export function checkExports(root: string, exports = plannedExports(root)): string[] {
  return exports.flatMap((e) => {
    const file = join(root, e.path);
    if (!existsSync(file)) return [`${e.path} is missing; run pnpm ds:portraits`];
    if (e.format === 'avif') return []; // readImageSize reads PNG, JPEG and WebP; AVIF is checked by sharp below.
    const size = readImageSize(file);
    return size?.width === e.width && size.height === e.height
      ? []
      : [`${e.path} is ${size?.width}×${size?.height}, expected ${e.width}×${e.height}`];
  });
}

export async function buildPortraits(root: string): Promise<PortraitExport[]> {
  const exports = plannedExports(root);
  for (const e of exports) {
    const image = sharp(join(root, e.source)).resize({ width: e.width, height: e.height });
    const out = join(root, e.path);
    if (e.format === 'avif') await image.avif({ quality: 55, effort: 6 }).toFile(out);
    else await image.webp({ quality: 80, effort: 6 }).toFile(out);
  }
  return exports;
}

/** AVIF sizes, read with sharp (async), for --check. */
async function checkAvif(root: string, exports: PortraitExport[]): Promise<string[]> {
  const problems: string[] = [];
  for (const e of exports.filter((x) => x.format === 'avif')) {
    const file = join(root, e.path);
    if (!existsSync(file)) continue;
    const { width, height } = await sharp(file).metadata();
    if (width !== e.width || height !== e.height)
      problems.push(`${e.path} is ${width}×${height}, expected ${e.width}×${e.height}`);
  }
  return problems;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  const run = async () => {
    if (process.argv.includes('--check')) {
      const exports = plannedExports(root);
      const problems = [...checkExports(root, exports), ...(await checkAvif(root, exports))];
      if (problems.length) {
        problems.forEach((p) => console.error(`ds:portraits: ${p}`));
        process.exit(1);
      }
      console.log(`ds:portraits: ${exports.length} exports up to date`);
      return;
    }
    const exports = await buildPortraits(root);
    const dirs = [...new Set(exports.map((e) => dirname(e.path)))];
    console.log(`ds:portraits: ${exports.length} exports in ${dirs.join(', ')}`);
  };
  run().catch((e) => {
    console.error(`ds:portraits failed: ${(e as Error).message}`);
    process.exit(1);
  });
}
