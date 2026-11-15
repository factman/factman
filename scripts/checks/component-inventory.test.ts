/**
 * ETE-196: docs/component-inventory.md is the map from the design canvas to Angular components.
 * Every component built under src/app/ui and src/app/features must have a row there with the
 * same class name, Atomic level and selector, so the inventory and the code never drift.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

const ROOT = process.cwd();
const INVENTORY = 'docs/component-inventory.md';
const LEVELS = {
  Atoms: 'atom',
  Molecules: 'molecule',
  Organisms: 'organism',
  Templates: 'template',
  Pages: 'page',
} as const;
type Level = (typeof LEVELS)[keyof typeof LEVELS];

interface Entry {
  name: string;
  level: Level;
  selector: string;
}

const cell = (text: string) => text.match(/^`([^`]+)`$/)?.[1];

/** Rows of the inventory's level sections: component name, level and selector. */
export function readInventory(markdown: string): Entry[] {
  const entries: Entry[] = [];
  let level: Level | undefined;
  for (const line of markdown.split('\n')) {
    const heading = line.match(/^## (\w+)/);
    if (heading) level = LEVELS[heading[1] as keyof typeof LEVELS];
    if (!level || !line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const name = cell(cells[2] ?? '');
    const selector = cell(cells[3] ?? '');
    if (name && selector) entries.push({ name, level, selector });
  }
  return entries;
}

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const path = join(dir, f);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

/** Components in the code that carry an `@level` tag. */
function builtComponents(): Entry[] {
  return ['src/app/ui', 'src/app/features']
    .flatMap((dir) => files(join(ROOT, dir)))
    .filter((f) => f.endsWith('.ts') && !/\.(spec|stories)\.ts$/.test(f))
    .flatMap((f) => {
      const source = readFileSync(f, 'utf8');
      const level = source.match(/@level (\w+)/)?.[1] as Level | undefined;
      const selector = source.match(/selector:\s*'([^']+)'/)?.[1];
      const name = source.match(/export class (\w+)/)?.[1];
      return level && selector && name ? [{ name, level, selector }] : [];
    });
}

describe('component inventory (ETE-196)', () => {
  const inventory = readInventory(readFileSync(join(ROOT, INVENTORY), 'utf8'));

  test('lists every level with unique names and fm- selectors', () => {
    for (const level of Object.values(LEVELS))
      assert.ok(
        inventory.some((e) => e.level === level),
        `no ${level} rows`,
      );
    const dupes = (key: keyof Entry) =>
      inventory.map((e) => e[key]).filter((v, i, all) => all.indexOf(v) !== i);
    assert.deepEqual(dupes('name'), [], 'duplicate component names');
    assert.deepEqual(dupes('selector'), [], 'duplicate selectors');
    for (const { name, selector } of inventory)
      assert.match(selector, /^(fm-[a-z0-9-]+|\[fm[A-Z]\w*\])$/, `${name}: selector ${selector}`);
  });

  test('every built component matches its row', () => {
    const built = builtComponents();
    assert.ok(built.length > 0, 'found no components with an @level tag');
    for (const component of built) {
      const row = inventory.find((e) => e.name === component.name);
      assert.ok(row, `${component.name} is not in ${INVENTORY}`);
      assert.deepEqual(row, component, `${component.name} differs from its inventory row`);
    }
  });
});
