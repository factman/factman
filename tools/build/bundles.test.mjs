// Bundle check (ETE-41): only the data a page needs reaches its bundle.
// Every page downloads main-*.js and the chunks that every prerendered page preloads; content data
// must not be in them. A page's own chunks (the home page's profile and contact data, ETE-89) are
// preloaded by that page's HTML only. Run with: pnpm test:build
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
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

test('the home page prerenders its deferred sections in full (ETE-114)', () => {
  // Stack to Contact are `@defer (hydrate on viewport)`: the HTML has their content, not placeholders.
  const home = read('index.html');
  assert.ok(
    !home.includes('class="home-deferred"'),
    'a deferred section prerendered as a placeholder',
  );
  for (const marker of [
    'fm-tech-stack',
    'experience-timeline-item',
    'service-card-link',
    'project-gallery-list',
    'stats-panel-counters',
    'fm-blog-feed',
    'fm-contact-form',
  ]) {
    assert.ok(home.includes(marker), `${marker} is missing from the prerendered home page`);
  }
});

test('the terminal host and its commands are a lazy chunk, not in the initial bundle (FR-36)', () => {
  // The commands' text (terminal-commands.ts): the host, its commands and the data they read load
  // with the terminal. The Terminal organism itself is in the shared UI kit chunk with the others.
  const marker = 'Preview and download them in the';
  for (const f of initial) assert.ok(!read(f).includes(marker), `the terminal is in ${f}`);
  assert.ok(
    js.some((f) => !initial.has(f) && read(f).includes(marker)),
    'no lazy chunk holds the terminal',
  );
});

// Performance budgets (PF, ETE-126): the JavaScript each prerendered page downloads at once (its
// entry script and modulepreloads), gzipped. Angular's own "initial" budget (angular.json) covers
// the app's initial files; this covers what each route adds. Every page shares one UI-kit chunk
// (the @ui barrels can't be split by route), which sets the floor; a page that grows past its
// ceiling fails the build. Lower the ceilings when the chunking work lands.
const JS_BUDGET_KB = {
  'index.html': 240,
  'services/index.html': 230,
  'projects/index.html': 230,
  'blog/index.html': 225,
  'privacy/index.html': 215,
  '404.html': 215,
};
const gzipKb = (files) =>
  [...files].reduce(
    (kb, f) =>
      kb + gzipSync(readFileSync(join(dist, f.replace(/^\//, ''))), { level: 9 }).length / 1024,
    0,
  );

test('each page stays within its JavaScript budget (gzip, ETE-126)', () => {
  const rows = Object.entries(JS_BUDGET_KB).map(([page, budget]) => {
    const kb = gzipKb(loads(page));
    return { page, kb: Math.round(kb * 10) / 10, budget };
  });
  console.log(
    `\n${rows.map((r) => `${r.page.padEnd(22)} ${String(r.kb).padStart(6)} KB gz  (budget ${r.budget})`).join('\n')}\n`,
  );
  for (const r of rows)
    assert.ok(r.kb <= r.budget, `${r.page}: ${r.kb} KB gz, budget ${r.budget} KB`);
});
