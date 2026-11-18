import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { checkExports, plannedExports, widthsFor } from './build-portraits';

describe('ds:portraits (ETE-198)', () => {
  test('exports half, three-quarters and full width, even and never enlarged', () => {
    assert.deepEqual(widthsFor(720), [360, 540, 720]);
    assert.deepEqual(widthsFor(900), [450, 676, 900]);
  });

  test('plans AVIF and WebP for each profile photo, keeping the aspect ratio', () => {
    const exports = plannedExports(process.cwd());
    assert.equal(exports.length, 18);
    const hero = exports.find((e) => e.path === 'src/assets/profile/odunayo-hero-360.avif');
    assert.deepEqual(hero && { width: hero.width, height: hero.height }, {
      width: 360,
      height: 450,
    });
  });

  test('every export is in the repo at its size (run pnpm ds:portraits if not)', () => {
    assert.deepEqual(checkExports(process.cwd()), []);
  });
});
