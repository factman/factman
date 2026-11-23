// SEO check on the prerendered pages (ETE-112): every page has one title, its own description, a
// canonical URL on the production origin, and the Open Graph and Twitter tags with the image, its
// size and alt. The not-found page is noindex with no canonical URL; a preview build is noindex
// everywhere. Runs in pnpm test:build (preview) and pnpm test:build-production.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { BUILD_VARIANT, DIST } from './inline-scripts.mjs';

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));
const projects = JSON.parse(readFileSync('src/data/projects.json', 'utf8'));
const services = JSON.parse(readFileSync('src/data/services.json', 'utf8'));

/** Every indexable prerendered page, by path. */
const PAGES = [
  '/',
  '/services',
  '/projects',
  '/blog',
  '/privacy',
  ...services.map((s) => `/services/${s.slug}`),
  ...projects.map((p) => `/projects/${p.slug}`),
];

/** Detail pages: their tags come from the project or service. */
const DETAIL = /^\/(services|projects)\/./;

const file = (path) => join(DIST, path === '/' ? 'index.html' : `${path.slice(1)}/index.html`);

const decode = (text) =>
  text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** The head of a built page: titles, canonical links, and meta content by name or property. */
function head(html) {
  const part = html.slice(0, html.indexOf('</head>'));
  const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  const meta = {};
  for (const [tag] of part.matchAll(/<meta\s[^>]*>/g)) {
    const key = attr(tag, 'name') ?? attr(tag, 'property');
    if (key) (meta[key] ??= []).push(decode(attr(tag, 'content') ?? ''));
  }
  return {
    titles: [...part.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => decode(m[1])),
    canonicals: [...part.matchAll(/<link\s[^>]*rel="canonical"[^>]*>/g)].map((m) =>
      attr(m[0], 'href'),
    ),
    meta,
  };
}

const robots = BUILD_VARIANT === 'preview' ? 'noindex' : site.robots;

test('every page has one title, its own description and a canonical URL', () => {
  const descriptions = new Map();
  for (const path of PAGES) {
    assert.ok(existsSync(file(path)), `${path} is not prerendered`);
    const { titles, canonicals, meta } = head(readFileSync(file(path), 'utf8'));
    assert.equal(titles.length, 1, `${path}: ${titles.length} titles`);
    assert.ok(titles[0].endsWith(site.name), `${path}: title ${titles[0]}`);
    assert.deepEqual(canonicals, [`${site.url}${path}`], `${path}: canonical`);
    assert.equal(meta.description?.length, 1, `${path}: description tags`);
    const [description] = meta.description;
    // Route descriptions are written to 50 to 160 characters; detail pages use the data's summary.
    if (!DETAIL.test(path)) {
      assert.ok(description.length >= 50 && description.length <= 160, `${path}: ${description}`);
    }
    assert.ok(!descriptions.has(description), `${path} repeats ${descriptions.get(description)}`);
    descriptions.set(description, path);
    assert.deepEqual(meta.robots, [robots], `${path}: robots`);
  }
});

test('every page has Open Graph and Twitter tags, with the image, its size and alt', () => {
  const image = `${site.url}/assets/${site.ogImage}`;
  for (const path of PAGES) {
    const { titles, meta } = head(readFileSync(file(path), 'utf8'));
    const one = (key) => {
      assert.equal(meta[key]?.length, 1, `${path}: ${key} appears ${meta[key]?.length ?? 0} times`);
      return meta[key][0];
    };
    assert.equal(one('og:title'), titles[0], path);
    assert.equal(one('twitter:title'), titles[0], path);
    assert.equal(one('og:description'), one('description'), path);
    assert.equal(one('twitter:description'), one('description'), path);
    assert.equal(one('og:url'), `${site.url}${path}`, path);
    assert.equal(one('og:site_name'), site.name, path);
    assert.equal(one('og:locale'), site.locale, path);
    assert.equal(one('og:type'), DETAIL.test(path) ? 'article' : 'website');
    assert.equal(one('og:image'), image, path);
    assert.equal(one('og:image:width'), '1200', path);
    assert.equal(one('og:image:height'), '630', path);
    assert.equal(one('og:image:alt'), site.ogImageAlt, path);
    assert.equal(one('twitter:card'), 'summary_large_image', path);
    assert.equal(one('twitter:image'), image, path);
    assert.equal(one('twitter:image:alt'), site.ogImageAlt, path);
  }
  assert.ok(existsSync(join('src/assets', site.ogImage)), `src/assets/${site.ogImage} is missing`);
});

test('detail pages take their title and description from their data', () => {
  for (const [kind, items] of [
    ['services', services],
    ['projects', projects],
  ]) {
    for (const item of items) {
      const { titles, meta } = head(readFileSync(file(`/${kind}/${item.slug}`), 'utf8'));
      assert.equal(titles[0], site.titleTemplate.replace('%s', item.title));
      assert.deepEqual(meta.description, [item.summary]);
    }
  }
});

test('the not-found page is noindex, with no canonical URL', () => {
  for (const page of ['404.html', '404/index.html']) {
    const { canonicals, meta } = head(readFileSync(join(DIST, page), 'utf8'));
    assert.deepEqual(meta.robots, ['noindex'], page);
    assert.deepEqual(canonicals, [], page);
  }
});
