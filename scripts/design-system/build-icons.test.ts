import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { exportName, ICONS_TS, iconsFromBundle, readIcons, renderIconsModule } from './build-icons';

describe('ds:icons (ETE-69, ADR-004)', () => {
  test('names each icon export after its kebab-case name', () => {
    assert.equal(exportName('arrow-up-right'), 'iconArrowUpRight');
    assert.equal(exportName('x'), 'iconX');
    assert.equal(exportName('git-pull-request'), 'iconGitPullRequest');
  });

  test('reads the ICONS literal out of a DS bundle', () => {
    const bundle = [
      '(function () {',
      '  var ICONS = {"x":["M0 0Z",0,"fill"],"menu":["M4 6L20 6",1.5]};',
      '  function Icon(props) {}',
    ].join('\n');
    assert.deepEqual(iconsFromBundle(bundle), {
      x: ['M0 0Z', 0, 'fill'],
      menu: ['M4 6L20 6', 1.5],
    });
    assert.throws(() => iconsFromBundle('var NOPE = {}'), /no `var ICONS/);
  });

  test('renders one IconDef per icon, filled marks without a stroke', async () => {
    const out = await renderIconsModule({ menu: ['M4 6L20 6', 1.5], x: ['M0 0Z', 0, 'fill'] });
    assert.match(out, /export type IconName = 'menu' \| 'x';/);
    assert.match(
      out,
      /export const iconMenu: IconDef = \{ name: 'menu', d: 'M4 6L20 6', stroke: 1\.5 \};/,
    );
    assert.match(out, /export const iconX: IconDef = \{ name: 'x', d: 'M0 0Z', fill: true \};/);
    await assert.rejects(renderIconsModule({ Bad_Name: ['M0 0', 1.5] }), /not kebab-case/);
  });

  test('icons.ts is up to date with icons.json (run pnpm ds:icons if not)', async () => {
    const root = process.cwd();
    assert.equal(
      readFileSync(join(root, ICONS_TS), 'utf8'),
      await renderIconsModule(readIcons(root)),
    );
  });

  test('every icon a data file names exists in the set', () => {
    const root = process.cwd();
    const names = new Set(Object.keys(readIcons(root)));
    const dataDir = join(root, 'src/data');
    const missing = readdirSync(dataDir)
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) =>
        [...readFileSync(join(dataDir, f), 'utf8').matchAll(/"icon":\s*"([^"]+)"/g)]
          .map((m) => m[1])
          .filter((n) => !names.has(n))
          .map((n) => `${f}: ${n}`),
      );
    assert.deepEqual(missing, []);
  });
});
