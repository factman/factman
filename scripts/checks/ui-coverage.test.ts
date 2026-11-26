/**
 * ETE-83: UI test coverage per Atomic level. Every UI-kit component (src/app/ui: atoms to
 * templates) has a unit spec and a story; pages (src/app/features) are reported but not required
 * yet, since the Sections milestone builds them. The report counts, per level, the components
 * with a spec, a story and an interaction test: a story with a `play` function, or a case in the
 * UI suite (src/app/ui/ui-suite, PRD §12 UI-01 to UI-05) that renders it. Every organism must
 * have one (ETE-234).
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

/** Classes the UI suite's cases render: everything they import from the UI kit. */
export function suiteCovered(): Set<string> {
  const names = new Set<string>();
  for (const f of files(join(ROOT, 'src/app/ui/ui-suite')).filter((f) => f.endsWith('.spec.ts'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/import \{([^}]*)\} from '@ui\/[\w/-]+'/g)) {
      for (const n of m[1].split(',')) names.add(n.replace(/^\s*type\s+/, '').trim());
    }
  }
  return names;
}

const inFolder = (folder: string, suffix: string) =>
  readdirSync(folder)
    .filter((f) => f.endsWith(suffix))
    .map((f) => join(folder, f));

export function coverage(list: Component[], suite = suiteCovered()) {
  const levels = new Map<string, { total: number; spec: number; story: number; play: number }>();
  const missing: string[] = [];
  const untested: string[] = [];
  for (const c of list) {
    const required = c.level !== 'page';
    const specs = inFolder(c.folder, '.spec.ts');
    const stories = inFolder(c.folder, '.stories.ts');
    const play =
      stories.some((s) => /\bplay:\s*async/.test(readFileSync(s, 'utf8'))) || suite.has(c.name);
    const row = levels.get(c.level) ?? { total: 0, spec: 0, story: 0, play: 0 };
    row.total++;
    if (specs.length) row.spec++;
    else if (required) missing.push(`${c.name} (${relative(ROOT, c.folder)}): no spec`);
    if (stories.length) row.story++;
    else if (required) missing.push(`${c.name} (${relative(ROOT, c.folder)}): no story`);
    if (play) row.play++;
    else if (c.level === 'organism') untested.push(`${c.name} (${relative(ROOT, c.folder)})`);
    levels.set(c.level, row);
  }
  return { levels, missing, untested };
}

describe('UI coverage per Atomic level (ETE-83)', () => {
  const list = components();
  const { levels, missing, untested } = coverage(list);

  test('every UI-kit component has a spec and a story', () => {
    assert.ok(list.length > 0, 'found no components');
    assert.deepEqual(missing, []);
  });

  test('every organism has an interaction test (a story play function or a UI-suite case)', () => {
    assert.deepEqual(untested, []);
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
