/**
 * ETE-83: UI test coverage per Atomic level. Every UI-kit component (src/app/ui: atoms to
 * templates) has a unit spec and a story; pages (src/app/features) are reported but not required
 * yet, since the Sections milestone builds them. The report counts, per level, the components
 * with a spec, a story and an interaction test (a story with a `play` function).
 * Run with `pnpm test:scripts`; the table prints with the results.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { describe, test } from 'node:test';

const ROOT = process.cwd();

interface Component {
  name: string;
  level: string;
  folder: string;
}

const files = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const path = join(dir, f);
        return statSync(path).isDirectory() ? files(path) : [path];
      })
    : [];

/** Components with an `@level` tag, by the folder they live in. */
export function components(): Component[] {
  return ['src/app/ui', 'src/app/features']
    .flatMap((dir) => files(join(ROOT, dir)))
    .filter((f) => f.endsWith('.ts') && !/\.(spec|stories|fixtures)\.ts$/.test(f))
    .flatMap((f) => {
      const source = readFileSync(f, 'utf8');
      const level = source.match(/@level (\w+)/)?.[1];
      const name = source.match(/export class (\w+)/)?.[1];
      return level && name ? [{ name, level, folder: dirname(f) }] : [];
    });
}

const inFolder = (folder: string, suffix: string) =>
  readdirSync(folder)
    .filter((f) => f.endsWith(suffix))
    .map((f) => join(folder, f));

export function coverage(list: Component[]) {
  const levels = new Map<string, { total: number; spec: number; story: number; play: number }>();
  const missing: string[] = [];
  for (const c of list) {
    const required = c.level !== 'page';
    const specs = inFolder(c.folder, '.spec.ts');
    const stories = inFolder(c.folder, '.stories.ts');
    const play = stories.some((s) => /\bplay:\s*async/.test(readFileSync(s, 'utf8')));
    const row = levels.get(c.level) ?? { total: 0, spec: 0, story: 0, play: 0 };
    row.total++;
    if (specs.length) row.spec++;
    else if (required) missing.push(`${c.name} (${relative(ROOT, c.folder)}): no spec`);
    if (stories.length) row.story++;
    else if (required) missing.push(`${c.name} (${relative(ROOT, c.folder)}): no story`);
    if (play) row.play++;
    levels.set(c.level, row);
  }
  return { levels, missing };
}

describe('UI coverage per Atomic level (ETE-83)', () => {
  const list = components();
  const { levels, missing } = coverage(list);

  test('every UI-kit component has a spec and a story', () => {
    assert.ok(list.length > 0, 'found no components');
    assert.deepEqual(missing, []);
  });

  test('report', () => {
    const order = ['atom', 'molecule', 'organism', 'template', 'page'];
    const lines = ['level      components  spec  story  play'];
    for (const level of order) {
      const r = levels.get(level);
      if (r)
        lines.push(
          `${level.padEnd(10)} ${String(r.total).padStart(10)}  ${String(r.spec).padStart(4)}  ${String(r.story).padStart(5)}  ${String(r.play).padStart(4)}`,
        );
    }
    console.log(`\n${lines.join('\n')}\n`);
    assert.ok(basename(ROOT).length > 0);
  });
});
