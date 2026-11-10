import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';
import sharp, { type Sharp } from 'sharp';

import { imageSizeOf, readImageSize } from './image-size';

const dir = mkdtempSync(join(tmpdir(), 'image-size-'));
after(() => rmSync(dir, { recursive: true, force: true }));

const blank = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#07203f' } });

describe('readImageSize (DS-17)', () => {
  const cases: [string, (img: Sharp) => Sharp][] = [
    ['png', (img) => img.png()],
    ['jpg', (img) => img.jpeg()],
    ['webp (lossy)', (img) => img.webp()],
    ['webp (lossless)', (img) => img.webp({ lossless: true })],
  ];
  for (const [name, encode] of cases) {
    test(`reads the size of a ${name}`, async () => {
      const path = join(dir, `photo-${name.replace(/\W/g, '')}`);
      writeFileSync(path, await encode(blank(321, 457)).toBuffer());
      assert.deepEqual(readImageSize(path), { width: 321, height: 457 });
    });
  }

  test('reads an extended WebP (with alpha)', async () => {
    const buf = await sharp({
      create: { width: 200, height: 99, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } },
    })
      .webp()
      .toBuffer();
    assert.deepEqual(imageSizeOf(buf), { width: 200, height: 99 });
  });

  test('returns undefined for anything else', () => {
    assert.equal(imageSizeOf(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), undefined);
    assert.equal(imageSizeOf(Buffer.alloc(0)), undefined);
  });
});
