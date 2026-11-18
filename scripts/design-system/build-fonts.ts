/**
 * `pnpm ds:fonts`: self-hosts the design system's fonts (ETE-23) so no request goes to Google.
 * - copies the Latin and Latin-Extended woff2 files from the pinned @fontsource packages into
 *   src/assets/fonts/ (version in the file name, so they can be cached as immutable)
 * - writes src/styles/generated/fonts.css: @font-face rules (font-display: swap, unicode-range per
 *   subset), size-adjusted fallback faces (Capsize metrics) and the --font-* tokens with the fallbacks
 * - writes the preload <link> for the critical file into src/index.html, between fonts markers
 * `pnpm ds:fonts --check` fails if any of those is out of date.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFontStack } from '@capsizecss/core';
import arial from '@capsizecss/metrics/arial';
import courierNew from '@capsizecss/metrics/courierNew';
import jetBrainsMono from '@capsizecss/metrics/jetBrainsMono';
import jost from '@capsizecss/metrics/jost';
import plusJakartaSans from '@capsizecss/metrics/plusJakartaSans';

export const FONTS_DIR = 'src/assets/fonts';
export const FONTS_CSS = 'src/styles/generated/fonts.css';
export const INDEX_HTML = 'src/index.html';
export const SUBSETS = ['latin', 'latin-ext'] as const;
const PRELOAD_START = '<!-- fonts:preload (pnpm ds:fonts) -->';
const PRELOAD_END = '<!-- /fonts:preload -->';

type Metrics = Parameters<typeof createFontStack>[0][number];
export interface FontSpec {
  /** Token suffix: --font-<token>. */
  token: 'sans' | 'mono' | 'logo';
  family: string;
  pkg: string;
  /** woff2 file name in the package's files/ folder, with {subset}. */
  file: string;
  /** CSS file in the package that holds the unicode-range per subset. */
  css: string;
  weight: string;
  metrics: Metrics;
  fallback: Metrics;
  /** Generic families after the fallback face, as in the design system's token. */
  tail: string;
  /** Subsets to preload (critical, above the fold). */
  preload: readonly string[];
}

export const FONTS: FontSpec[] = [
  {
    token: 'sans',
    family: 'Plus Jakarta Sans',
    pkg: '@fontsource-variable/plus-jakarta-sans',
    file: 'plus-jakarta-sans-{subset}-wght-normal.woff2',
    css: 'wght.css',
    weight: '200 800',
    metrics: plusJakartaSans,
    fallback: arial,
    tail: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    preload: ['latin'],
  },
  {
    token: 'mono',
    family: 'JetBrains Mono',
    pkg: '@fontsource-variable/jetbrains-mono',
    file: 'jetbrains-mono-{subset}-wght-normal.woff2',
    css: 'wght.css',
    weight: '100 800',
    metrics: jetBrainsMono,
    fallback: courierNew,
    tail: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    preload: [],
  },
  {
    // Only the logo wordmarks use --font-logo, so the browser fetches Jost only where a logo renders.
    token: 'logo',
    family: 'Jost',
    pkg: '@fontsource/jost',
    file: 'jost-{subset}-500-normal.woff2',
    css: '500.css',
    weight: '500',
    metrics: jost,
    fallback: arial,
    tail: '"Plus Jakarta Sans", system-ui, sans-serif',
    preload: [],
  },
];

const pkgDir = (root: string, pkg: string) => join(root, 'node_modules', pkg);
const version = (root: string, pkg: string) =>
  (JSON.parse(readFileSync(join(pkgDir(root, pkg), 'package.json'), 'utf8')) as { version: string })
    .version;
const slugOf = (f: FontSpec) => f.family.toLowerCase().replace(/\s+/g, '-');
export const assetName = (f: FontSpec, subset: string, v: string) =>
  `${slugOf(f)}-${subset}-v${v}.woff2`;

/** unicode-range of one subset, read from the package's CSS (`/* <file stem> *\/` comment above each face). */
export function unicodeRange(css: string, fileStem: string): string {
  const block = css.split(`/* ${fileStem} */`)[1];
  const m = block && /unicode-range:\s*([^;]+);/.exec(block);
  if (!m) throw new Error(`no unicode-range for ${fileStem}`);
  return m[1].trim();
}

export interface FontOutput {
  css: string;
  assets: Map<string, string>; // asset name → source path
  preload: string;
}

export function buildFonts(root: string, fonts = FONTS): FontOutput {
  const faces: string[] = [];
  const fallbacks: string[] = [];
  const tokens: string[] = [];
  const assets = new Map<string, string>();
  const preloads: string[] = [];
  for (const f of fonts) {
    const v = version(root, f.pkg);
    const pkgCss = readFileSync(join(pkgDir(root, f.pkg), f.css), 'utf8');
    for (const subset of SUBSETS) {
      const file = f.file.replace('{subset}', subset);
      const name = assetName(f, subset, v);
      assets.set(name, join(pkgDir(root, f.pkg), 'files', file));
      faces.push(
        [
          `/* ${f.family} · ${subset} · ${f.pkg}@${v} (OFL-1.1) */`,
          '@font-face {',
          `  font-family: "${f.family}";`,
          '  font-style: normal;',
          `  font-weight: ${f.weight};`,
          '  font-display: swap;',
          `  src: url("/assets/fonts/${name}") format("woff2");`,
          `  unicode-range: ${unicodeRange(pkgCss, file.replace(/\.woff2$/, ''))};`,
          '}',
        ].join('\n'),
      );
      if (f.preload.includes(subset)) {
        preloads.push(
          `<link rel="preload" href="/assets/fonts/${name}" as="font" type="font/woff2" crossorigin />`,
        );
      }
    }
    const stack = createFontStack([f.metrics, f.fallback], { fontFaceFormat: 'styleString' });
    fallbacks.push(stack.fontFaces.trim());
    const familyList = stack.fontFamily.split(',').slice(0, 2).join(',');
    tokens.push(`  --font-${f.token}: ${familyList}, ${f.tail};`);
  }
  const css = [
    '/* Self-hosted fonts, generated by scripts/design-system/build-fonts.ts (pnpm ds:fonts). Do not edit. */',
    '/* Loaded after tokens.css: the --font-* tokens gain size-adjusted fallbacks to limit layout shift. */',
    '',
    faces.join('\n\n'),
    '',
    '/* Size-adjusted local fallbacks (Capsize metrics) */',
    fallbacks.join('\n\n'),
    '',
    ':root {',
    ...tokens,
    '}',
    '',
  ].join('\n');
  return { css, assets, preload: preloads.join('\n    ') };
}

export function withPreload(html: string, preload: string): string {
  const block = `${PRELOAD_START}\n    ${preload}\n    ${PRELOAD_END}`;
  const re = new RegExp(
    `${PRELOAD_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${PRELOAD_END}`,
  );
  if (re.test(html)) return html.replace(re, block);
  return html.replace('  </head>', `    ${block}\n  </head>`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  const { css, assets, preload } = buildFonts(root);
  const html = readFileSync(join(root, INDEX_HTML), 'utf8');
  const nextHtml = withPreload(html, preload);
  if (process.argv.includes('--check')) {
    const stale: string[] = [];
    if (!existsSync(join(root, FONTS_CSS)) || readFileSync(join(root, FONTS_CSS), 'utf8') !== css)
      stale.push(FONTS_CSS);
    // Prettier may rewrap the <link>; compare ignoring whitespace.
    const squash = (x: string) => x.replace(/\s+/g, ' ').replace(/ \/>/g, '/>');
    if (squash(html) !== squash(nextHtml)) stale.push(INDEX_HTML);
    const present = existsSync(join(root, FONTS_DIR)) ? readdirSync(join(root, FONTS_DIR)) : [];
    for (const [name, src] of assets) {
      const dst = join(root, FONTS_DIR, name);
      if (!existsSync(dst) || !readFileSync(dst).equals(readFileSync(src)))
        stale.push(`${FONTS_DIR}/${name}`);
    }
    stale.push(
      ...present.filter((n) => !assets.has(n)).map((n) => `${FONTS_DIR}/${n} (unexpected)`),
    );
    if (stale.length) {
      console.error(`ds:fonts is out of date: ${stale.join(', ')}. Run pnpm ds:fonts`);
      process.exit(1);
    }
    console.log('ds:fonts: up to date');
  } else {
    rmSync(join(root, FONTS_DIR), { recursive: true, force: true });
    mkdirSync(join(root, FONTS_DIR), { recursive: true });
    for (const [name, src] of assets) copyFileSync(src, join(root, FONTS_DIR, name));
    mkdirSync(join(root, 'src/styles/generated'), { recursive: true });
    writeFileSync(join(root, FONTS_CSS), css);
    writeFileSync(join(root, INDEX_HTML), nextHtml);
    console.log(
      `ds:fonts: ${assets.size} woff2 files in ${FONTS_DIR}, ${FONTS_CSS}, preload in ${INDEX_HTML}`,
    );
  }
}
