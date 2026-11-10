import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import sharp from 'sharp';

import {
  check,
  MASKABLE_SCALE,
  icoSizes,
  manifest,
  OUTPUTS,
  packIco,
  sha256,
  SOURCE_DIR,
  SOURCES,
} from './build-brand';

test('packs PNG entries into a valid .ico directory', () => {
  const a = Buffer.from('png-a');
  const b = Buffer.from('png-bb');
  const ico = packIco([
    { size: 16, png: a },
    { size: 256, png: b },
  ]);
  assert.equal(ico.readUInt16LE(2), 1); // icon
  assert.deepEqual(icoSizes(ico), [16, 256]);
  const offsetB = ico.readUInt32LE(6 + 16 + 12);
  assert.equal(ico.subarray(offsetB, offsetB + b.length).toString(), 'png-bb');
  assert.equal(ico.length, 6 + 32 + a.length + b.length);
});

test('the sources are the design system files, unmodified', () => {
  for (const [file, hash] of Object.entries(SOURCES)) {
    assert.equal(sha256(readFileSync(join(SOURCE_DIR, file))), hash, file);
  }
});

test('the manifest names the site and lists the icons', () => {
  const m = JSON.parse(manifest()) as { name: string; icons: { src: string }[] };
  assert.equal(m.name, 'Odunayo Mohammed');
  assert.deepEqual(
    m.icons.map((i) => i.src),
    ['/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png'],
  );
  for (const i of m.icons)
    assert.ok(
      OUTPUTS.some((o) => `public${i.src}` === o.path),
      i.src,
    );
});

test('every generated file is present at its size (pnpm ds:brand)', async () => {
  assert.deepEqual(await check(process.cwd()), []);
});

test('maskable icons keep the whole mark inside the safe zone (circle of radius 40%)', async () => {
  // Half the diagonal of the centred mark must not reach past 40% of the icon.
  assert.ok((MASKABLE_SCALE / 2) * Math.SQRT2 <= 0.4);
  const { data, info } = await sharp('public/icon-maskable-512.png')
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  assert.equal(info.hasAlpha, false); // flattened: no transparent corners
  // Outside the mark: the light canvas colour. The mark starts at 22% of the width.
  for (const [x, y] of [
    [0, 0],
    [511, 511],
    [256, 100],
    [100, 256],
  ])
    assert.equal(px(x, y), 'dde5ef', `${x},${y}`);
  assert.notEqual(px(256, 256), 'dde5ef'); // the mark is in the middle
});
