import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  check,
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
    ['/icon-192.png', '/icon-512.png'],
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
