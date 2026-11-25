/**
 * The résumé fonts (ETE-107, ETE-223): Carlito for text and Caladea for headings, metric-compatible
 * with Calibri and Cambria and free to embed (OFL-1.1). They come from the @fontsource packages
 * (dev dependencies) and are inlined as woff2 data URIs, so each résumé's HTML is self-contained
 * and Chromium embeds the glyphs in the PDF. No font is fetched from a CDN.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Latin covers the résumés' text; latin-ext covers names and places with diacritics. */
const SUBSETS = [
  [
    'latin',
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2190-2199, U+2212, U+2215',
  ],
  [
    'latin-ext',
    'U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
  ],
] as const;

/** Each family with the weights and styles the layout uses. */
export const RESUME_FONTS = [
  {
    family: 'Carlito',
    pkg: '@fontsource/carlito',
    faces: ['400-normal', '400-italic', '700-normal', '700-italic'],
  },
  { family: 'Caladea', pkg: '@fontsource/caladea', faces: ['700-normal'] },
] as const;

/** The woff2 file of one face in one subset, from its package. */
export function fontFile(pkg: string, family: string, subset: string, face: string): string {
  const root = dirname(require.resolve(`${pkg}/package.json`));
  return join(root, 'files', `${family.toLowerCase()}-${subset}-${face}.woff2`);
}

/** `@font-face` rules for every family, face and subset, with the woff2 inlined. */
export function resumeFontCss(read: (file: string) => Buffer = readFileSync): string {
  return RESUME_FONTS.flatMap(({ family, pkg, faces }) =>
    faces.flatMap((face) => {
      const [weight, style] = face.split('-');
      return SUBSETS.map(([subset, range]) => {
        const data = read(fontFile(pkg, family, subset, face)).toString('base64');
        return `@font-face{font-family:${family};font-style:${style};font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${range}}`;
      });
    }),
  ).join('\n');
}
