/**
 * `pnpm ds:og` (ETE-198): the default Open Graph image, 1200 × 630, for link previews.
 * The card is plain HTML in the site's fonts and brand colours, filled from the data files
 * (name, headline, location and years from profile.json; the URL from site.json; the hero
 * portrait), and rendered by Playwright's Chromium, so text is set exactly as on the site.
 * Written to src/assets/og/default.jpg; site.json `ogImage` points at it.
 * `pnpm ds:og --check` fails when the image is missing or not 1200 × 630.
 * Per-page variants (ETE-113) can call `renderOgHtml` with their own title and eyebrow.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { yearsSince } from '../../src/app/shared/experience/years';
import { readImageSize } from '../data/image-size';

export const OG_FILE = 'src/assets/og/default.jpg';
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Brand colours from tokens.json (fixed: link previews have no theme). */
const NAVY = '#07203f'; // --blue-900
const NAVY_DEEP = '#030e20'; // --blue-950
const BLUE = '#0b4c9e'; // --blue-600, the brand blue
const ON_NAVY = '#bad3f4'; // --blue-200
const ON_NAVY_MUTED = '#8cb4ea'; // --blue-300

const FONTS = {
  sans: 'src/assets/fonts/plus-jakarta-sans-latin-v5.3.0.woff2',
  mono: 'src/assets/fonts/jetbrains-mono-latin-v5.3.0.woff2',
} as const;
const LOCKUP = 'src/assets/brand/odunayo-lockup-dark-192.webp';

export interface OgContent {
  name: string;
  headline: string;
  /** Small line above the name, e.g. a page name for per-page variants. Optional. */
  eyebrow?: string;
  meta: string;
  url: string;
  /** Portrait path relative to the repository root. */
  portrait: string;
}

const dataUri = (root: string, path: string, type: string) =>
  `data:${type};base64,${readFileSync(join(root, path)).toString('base64')}`;
const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** The default card's content, from the data files. */
export function defaultContent(root: string, now = new Date()): OgContent {
  const read = (f: string) => JSON.parse(readFileSync(join(root, 'src/data', f), 'utf8'));
  const profile = read('profile.json');
  const site = read('site.json');
  return {
    name: profile.name,
    headline: profile.headline,
    meta: `${profile.location.city}, ${profile.location.country} · ${yearsSince(profile.careerStart, now)}+ years`,
    url: new URL(site.url).host,
    portrait: join('src/assets', profile.photo.src),
  };
}

/** The card as a self-contained HTML page (fonts and images inlined). */
export function renderOgHtml(root: string, content: OgContent): string {
  const font = (family: string, path: string, weight: string) =>
    `@font-face{font-family:'${family}';src:url(${dataUri(root, path, 'font/woff2')}) format('woff2');font-weight:${weight};}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
${font('Plus Jakarta Sans', FONTS.sans, '200 800')}
${font('JetBrains Mono', FONTS.mono, '100 800')}
*{box-sizing:border-box;margin:0}
html,body{width:${OG_WIDTH}px;height:${OG_HEIGHT}px}
body{position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;color:#fff;
  background:radial-gradient(900px 600px at 18% 0%, ${BLUE}55, transparent 70%), linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)}
body::before{content:"";position:absolute;inset:0 0 auto 0;height:10px;background:${BLUE}}
.text{position:absolute;left:72px;top:84px;width:620px;display:flex;flex-direction:column;gap:22px}
.lockup{height:56px;width:auto;align-self:flex-start;margin-bottom:22px}
.eyebrow{font:600 22px/1.2 'JetBrains Mono',monospace;color:${ON_NAVY_MUTED};letter-spacing:.04em;text-transform:uppercase}
.name{font-weight:800;font-size:68px;line-height:1.04;letter-spacing:-.01em}
.headline{font-weight:500;font-size:32px;line-height:1.3;color:${ON_NAVY}}
.foot{position:absolute;left:72px;bottom:64px;display:flex;flex-direction:column;gap:10px;font:500 22px/1.3 'JetBrains Mono',monospace}
.meta{color:${ON_NAVY}}
.url{color:${ON_NAVY_MUTED}}
.portrait{position:absolute;right:72px;top:72px;width:388px;height:486px;object-fit:cover;border-radius:28px;
  border:1px solid rgba(255,255,255,.16);box-shadow:0 24px 60px -12px rgba(0,0,0,.55)}
</style></head><body>
<div class="text">
  <img class="lockup" src="${dataUri(root, LOCKUP, 'image/webp')}" alt="">
  ${content.eyebrow ? `<p class="eyebrow">${escapeHtml(content.eyebrow)}</p>` : ''}
  <h1 class="name">${escapeHtml(content.name)}</h1>
  <p class="headline">${escapeHtml(content.headline)}</p>
</div>
<div class="foot"><span class="meta">${escapeHtml(content.meta)}</span><span class="url">${escapeHtml(content.url)}</span></div>
<img class="portrait" src="${dataUri(root, content.portrait, 'image/webp')}" alt="">
</body></html>`;
}

/** Renders the card with Chromium and writes a JPEG of exactly 1200 × 630. */
export async function buildOg(
  root: string,
  content = defaultContent(root),
  out = OG_FILE,
): Promise<string> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: OG_WIDTH, height: OG_HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.setContent(renderOgHtml(root, content), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: 'png' });
    mkdirSync(dirname(join(root, out)), { recursive: true });
    await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(join(root, out));
    return out;
  } finally {
    await browser.close();
  }
}

/** Problems with the image on disk; empty when it exists at 1200 × 630. */
export function checkOg(root: string, file = OG_FILE): string[] {
  const path = join(root, file);
  if (!existsSync(path)) return [`${file} is missing; run pnpm ds:og`];
  const size = readImageSize(path);
  return size?.width === OG_WIDTH && size.height === OG_HEIGHT
    ? []
    : [`${file} is ${size?.width}×${size?.height}, expected ${OG_WIDTH}×${OG_HEIGHT}`];
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  if (process.argv.includes('--check')) {
    const problems = checkOg(root);
    problems.forEach((p) => console.error(`ds:og: ${p}`));
    if (problems.length) process.exit(1);
    console.log(`ds:og: ${OG_FILE} is ${OG_WIDTH}×${OG_HEIGHT}`);
  } else {
    buildOg(root).then(
      (file) => console.log(`ds:og: wrote ${file}`),
      (e) => {
        console.error(`ds:og failed: ${(e as Error).message}`);
        process.exit(1);
      },
    );
  }
}
