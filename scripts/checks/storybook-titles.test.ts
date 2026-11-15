/**
 * ETE-82: Storybook's sidebar follows the Atomic levels. A story under src/app/ui/<level>/ is
 * titled `<Level>/<Component>` (Atoms/, Molecules/, Organisms/, Templates/) and a story under
 * src/app/features/ is titled `Pages/<Page>`, so the sidebar always matches the folder.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { test } from 'node:test';

const ROOT = process.cwd();
const SECTION = {
  atoms: 'Atoms',
  molecules: 'Molecules',
  organisms: 'Organisms',
  templates: 'Templates',
  features: 'Pages',
} as const;

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const path = join(dir, f);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

/** The section a story file's title must start with, from its folder. */
export function expectedSection(path: string): string | undefined {
  const parts = path.split(sep);
  const app = parts.indexOf('app');
  const level = parts[app + 1] === 'ui' ? parts[app + 2] : parts[app + 1];
  return SECTION[level as keyof typeof SECTION];
}

test('expectedSection maps folders to sidebar sections', () => {
  assert.equal(
    expectedSection(join('src', 'app', 'ui', 'atoms', 'logo', 'logo.stories.ts')),
    'Atoms',
  );
  assert.equal(
    expectedSection(join('src', 'app', 'ui', 'organisms', 'site-header', 'site-header.stories.ts')),
    'Organisms',
  );
  assert.equal(expectedSection(join('src', 'app', 'features', 'home', 'home.stories.ts')), 'Pages');
  assert.equal(expectedSection(join('src', 'app', 'shared', 'x.stories.ts')), undefined);
});

test('every story is titled after its Atomic level', () => {
  const stories = files(join(ROOT, 'src/app')).filter((f) => f.endsWith('.stories.ts'));
  assert.ok(stories.length > 0, 'found no stories');
  for (const file of stories) {
    const path = relative(ROOT, file);
    const section = expectedSection(path);
    assert.ok(section, `${path}: stories belong in src/app/ui/<level> or src/app/features`);
    const title = readFileSync(file, 'utf8').match(/title:\s*'([^']+)'/)?.[1];
    assert.ok(title, `${path}: set an explicit title`);
    assert.match(
      title,
      new RegExp(`^${section}/[A-Z]`),
      `${path}: title must start with ${section}/`,
    );
  }
});
