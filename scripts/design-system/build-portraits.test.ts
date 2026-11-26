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
    // 11 profile photos (the canvas's portraits, page by page) and 3 résumé portraits, each
    // × 3 widths × 2 formats.
    assert.equal(exports.length, 84);
    assert.ok(exports.some((e) => e.path === 'src/assets/profile/odunayo-resume-mobile-360.webp'));
    const projects = exports.find((e) => e.path === 'src/assets/profile/odunayo-projects-450.webp');
    assert.deepEqual(projects && { width: projects.width, height: projects.height }, {
      width: 450,
      height: 254,
    });
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
