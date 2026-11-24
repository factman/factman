// Bundle check (ETE-41): only the data a page needs reaches its bundle.
// Every page downloads main-*.js and the chunks that every prerendered page preloads; content data
// must not be in them. A page's own chunks (the home page's profile and contact data, ETE-89) are
// preloaded by that page's HTML only. Run with: pnpm test:build
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const dist = 'dist/factman/browser';
const js = readdirSync(dist).filter((f) => f.endsWith('.js'));
/** The scripts a prerendered page loads at once: its entry script and modulepreloads. */
const loads = (page) =>
  new Set(
    [
      ...readFileSync(join(dist, page), 'utf8').matchAll(
        /<(?:script|link)[^>]+(?:src|href)="([^"]+\.js)"/g,
      ),
    ].map((m) => m[1]),
  );
const PAGES = [
  'index.html',
  '404.html',
  'blog/index.html',
  'privacy/index.html',
  'services/index.html',
  'projects/index.html',
];
const initial = PAGES.map(loads).reduce(
  (all, page) => new Set([...all].filter((f) => page.has(f))),
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
  'resumes.json': json('resumes.json').resumes[0].summary.slice(0, 80),
};

test('the initial bundle is the entry script plus its preloaded chunks', () => {
  assert.ok(
    [...initial].some((f) => /^main-.*\.js$/.test(f)),
    'main-*.js is not loaded by every page',
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

test('the home page ships no syntax highlighter: its code editor is highlighted at build time', () => {
  // highlight.ts's keyword list (ETE-90): only CodeBlock, on pages that show code samples, has it.
  for (const f of loads('index.html')) {
    assert.ok(!read(f).includes('abstract|as|async|await'), `the highlighter is in ${f}`);
  }
});
