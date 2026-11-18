/**
 * `pnpm ds:brand`: web and favicon sizes of the design system's logo artwork (ETE-25).
 * The mark is never redrawn: every output is a resize of the original PNGs in
 * src/styles/factman/logos/, copied as is from the Factman Design System (assets/Logos).
 * - src/assets/brand/: the AY mark and the ODUNAYO lockup, light and dark, at 1x and 2x (WebP)
 * - public/: favicon.ico (16, 32, 48), apple-touch-icon.png (180), icon-192.png, icon-512.png
 *   and site.webmanifest
 * `pnpm ds:brand --check` fails if a source no longer matches the design system file, or if an
 * output is missing, has the wrong size, or the manifest is out of date.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const SOURCE_DIR = 'src/styles/factman/logos';
export const BRAND_DIR = 'src/assets/brand';
export const PUBLIC_DIR = 'public';
export const MANIFEST = 'public/site.webmanifest';

/** Light canvas (--neutral-150) and the navy wordmark (--blue-900) from tokens.json. */
export const CANVAS_LIGHT = '#dde5ef';
export const BRAND_NAVY = '#07203f';

/** The design system's files, with the sha256 its asset store reports for each. */
export const SOURCES = {
  'factman-mark-light.png': '1739f7e54486285d22f66f0bf2eab2df8efd6b8a3c954507ecdd71fe5eb67992',
  'factman-mark-dark.png': '08e328826a6283238b626425ac4cda28500fc0b6232e23f2db2a886c5ab55692',
  'odunayo-lockup-light.png': '96f8d497b783a69d07f11d9cbb8a8eea59add439b46031d25bab405b136338a8',
  'odunayo-lockup-dark.png': '6dcccfd5ea0f1e4112e322c0ac1d167c0f208351b8d9e3eda1242a47e9b028ed',
} as const;
type Source = keyof typeof SOURCES;

export interface Output {
  /** Path relative to the repository root. */
  path: string;
  source: Source;
  width: number;
  height: number;
  format: 'webp' | 'png';
  /** Flatten transparent corners onto this colour (iOS fills them with black otherwise). */
  background?: string;
  /** Share of the canvas the artwork fills, centred (padding for maskable icons). Default 1. */
  scale?: number;
}

/**
 * Maskable icons: Android may crop to any shape inside a centred circle of radius 40% of the icon
 * (the safe zone). A square fits that circle when its side is at most 0.8 / √2 ≈ 0.566, so the
 * whole mark, bezel included, stays visible under every mask.
 */
export const MASKABLE_SCALE = 0.56;

const LOCKUP_RATIO = 2512 / 768;
const webAssets = (): Output[] =>
  (['light', 'dark'] as const).flatMap((theme) => [
    ...[128, 256].map((px) => ({
      path: `${BRAND_DIR}/ay-mark-${theme}-${px}.webp`,
      source: `factman-mark-${theme}.png` as Source,
      width: px,
      height: px,
      format: 'webp' as const,
    })),
    ...[96, 192].map((px) => ({
      path: `${BRAND_DIR}/odunayo-lockup-${theme}-${px}.webp`,
      source: `odunayo-lockup-${theme}.png` as Source,
      width: Math.round(px * LOCKUP_RATIO),
      height: px,
      format: 'webp' as const,
    })),
  ]);

export const ICO_SIZES = [16, 32, 48] as const;

export const OUTPUTS: Output[] = [
  ...webAssets(),
  ...[192, 512].map((px) => ({
    path: `${PUBLIC_DIR}/icon-${px}.png`,
    source: 'factman-mark-light.png' as Source,
    width: px,
    height: px,
    format: 'png' as const,
  })),
  {
    path: `${PUBLIC_DIR}/apple-touch-icon.png`,
    source: 'factman-mark-light.png',
    width: 180,
    height: 180,
    format: 'png',
    background: CANVAS_LIGHT,
  },
  ...[192, 512].map((px) => ({
    path: `${PUBLIC_DIR}/icon-maskable-${px}.png`,
    source: 'factman-mark-light.png' as Source,
    width: px,
    height: px,
    format: 'png' as const,
    background: CANVAS_LIGHT,
    scale: MASKABLE_SCALE,
  })),
];

export const manifest = () =>
  JSON.stringify(
    {
      name: 'Odunayo Mohammed',
      short_name: 'Odunayo',
      start_url: '/',
      display: 'minimal-ui',
      background_color: CANVAS_LIGHT,
      theme_color: BRAND_NAVY,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ) + '\n';

export const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

/** Packs PNG images into an .ico file (PNG-compressed entries, supported by every current browser). */
export function packIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, png }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); // width (0 means 256)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette size
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.png)]);
}

/** Sizes stored in an .ico file's directory. */
export function icoSizes(ico: Buffer): number[] {
  const count = ico.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => ico.readUInt8(6 + i * 16) || 256);
}

async function render(root: string, out: Output): Promise<Buffer> {
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const scale = out.scale ?? 1;
  const w = Math.round(out.width * scale);
  const h = Math.round(out.height * scale);
  // sharp runs flatten before resize and extend within one pipeline, so each step is its own pass.
  let buf = await sharp(join(root, SOURCE_DIR, out.source))
    .resize(w, h, { fit: 'contain', background: transparent })
    .png()
    .toBuffer();
  if (scale !== 1) {
    const left = Math.floor((out.width - w) / 2);
    const top = Math.floor((out.height - h) / 2);
    buf = await sharp(buf)
      .extend({
        left,
        right: out.width - w - left,
        top,
        bottom: out.height - h - top,
        background: transparent,
      })
      .png()
      .toBuffer();
  }
  let img = sharp(buf);
  if (out.background) img = img.flatten({ background: out.background });
  return out.format === 'webp'
    ? img.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer()
    : img.png({ compressionLevel: 9 }).toBuffer();
}

export async function favicon(root: string): Promise<Buffer> {
  const pngs = await Promise.all(
    ICO_SIZES.map(async (size) => ({
      size,
      png: await sharp(join(root, SOURCE_DIR, 'factman-mark-light.png'))
        .resize(size, size)
        .png()
        .toBuffer(),
    })),
  );
  return packIco(pngs);
}

/** Problems found by --check (empty when everything is up to date). */
export async function check(root: string): Promise<string[]> {
  const stale: string[] = [];
  for (const [file, hash] of Object.entries(SOURCES)) {
    const p = join(root, SOURCE_DIR, file);
    if (!existsSync(p) || sha256(readFileSync(p)) !== hash)
      stale.push(`${SOURCE_DIR}/${file} (not the design system file)`);
  }
  for (const out of OUTPUTS) {
    const p = join(root, out.path);
    if (!existsSync(p)) {
      stale.push(out.path);
      continue;
    }
    const meta = await sharp(p).metadata();
    if (meta.width !== out.width || meta.height !== out.height || meta.format !== out.format)
      stale.push(`${out.path} (${meta.format} ${meta.width}x${meta.height})`);
  }
  const ico = join(root, PUBLIC_DIR, 'favicon.ico');
  if (!existsSync(ico) || icoSizes(readFileSync(ico)).join() !== ICO_SIZES.join())
    stale.push(`${PUBLIC_DIR}/favicon.ico`);
  const m = join(root, MANIFEST);
  if (!existsSync(m) || readFileSync(m, 'utf8') !== manifest()) stale.push(MANIFEST);
  return stale;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
async function main(root: string): Promise<void> {
  if (process.argv.includes('--check')) {
    const stale = await check(root);
    if (stale.length) {
      console.error(`ds:brand is out of date: ${stale.join(', ')}. Run pnpm ds:brand`);
      process.exit(1);
    }
    console.log('ds:brand: up to date');
  } else {
    mkdirSync(join(root, BRAND_DIR), { recursive: true });
    for (const out of OUTPUTS) writeFileSync(join(root, out.path), await render(root, out));
    writeFileSync(join(root, PUBLIC_DIR, 'favicon.ico'), await favicon(root));
    writeFileSync(join(root, MANIFEST), manifest());
    console.log(
      `ds:brand: ${OUTPUTS.length} images, favicon.ico and site.webmanifest from ${SOURCE_DIR}`,
    );
  }
}
if (isMain) void main(process.cwd());
