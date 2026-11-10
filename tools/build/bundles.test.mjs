// Bundle check (ETE-41): only the data a page needs reaches its bundle.
// Every page downloads main-*.js and the chunks index.html preloads; content data must not be in
// them. Run with: pnpm test:build
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
  'projects.json': json('projects.json')[0].summary,
  'skills.json': '"jetbrains-ides"',
  'experience.json': json('experience.json')[0].roles[0].summary,
  'profile.json': json('profile.json').about[2],
  'contact.json': json('contact.json').whatsapp.message,
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

for (const [file, pages] of [
  ['services.json', 'services'],
  ['projects.json', 'projects'],
]) {
  test(`${file} ships in the lazy ${pages} chunks, where the ${pages} pages read it`, () => {
    const lazy = js.filter((f) => !initial.has(f) && read(f).includes(markers[file]));
    assert.ok(lazy.length > 0, `no lazy chunk contains ${file}`);
  });
}
