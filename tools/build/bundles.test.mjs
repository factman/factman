// Bundle check (ETE-41): only the data a page needs reaches its bundle.
// Every page downloads main-*.js and the chunks index.html preloads; content data must not be in
// them. Run after a build: pnpm test:bundles
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const dist = 'dist/factman/browser';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const js = readdirSync(dist).filter((f) => f.endsWith('.js'));
const initial = new Set(
  [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+\.js)"/g)].map((m) => m[1]),
);
const read = (f) => readFileSync(join(dist, f), 'utf8');
const json = (f) => JSON.parse(readFileSync(join('src/data', f), 'utf8'));

// One distinctive string per data file: text that only that file contains.
const markers = {
  'services.json': json('services.json')[0].audience,
  'clients.json': json('clients.json')[0].website,
};

test('the initial bundle is the entry script plus its preloaded chunks', () => {
  assert.ok(
    [...initial].some((f) => /^main-.*\.js$/.test(f)),
    'main-*.js is not in index.html',
  );
  for (const f of initial) assert.ok(js.includes(f), `${f} is linked but missing`);
});

for (const [file, marker] of Object.entries(markers)) {
  test(`${file} is not in the initial bundle`, () => {
    for (const f of initial) assert.ok(!read(f).includes(marker), `${file} content found in ${f}`);
  });
}
