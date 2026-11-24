// FR-30 (ETE-104): the site shows a city and country only. No street address may reach the built
// pages: house numbers with a street word, postcodes, or the `streetAddress` structured-data field.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { DIST, TOOL_DIRS } from './inline-scripts.mjs';

const STREET =
  /\b\d{1,5}[a-z]?,?\s+(?:[A-Z][\w'-]+\s+){1,4}(?:Street|St\.|Road|Rd\.|Avenue|Ave\.?|Close|Crescent|Lane|Way|Drive|Boulevard|Estate)\b/;

/** The site's HTML pages, without the tool folders (Storybook, coverage, reports). */
function pages(dir = DIST) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return TOOL_DIRS.includes(name) && dir === DIST ? [] : pages(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

test('no built page shows a street address (city and country only)', () => {
  const found = pages();
  assert.ok(found.length > 0, 'no pages were built');
  for (const file of found) {
    const text = readFileSync(file, 'utf8').replace(/<[^>]+>/g, ' ');
    assert.ok(!STREET.test(text), `${file} has what looks like a street address`);
    assert.ok(!text.includes('streetAddress'), `${file} has a streetAddress field`);
  }
});

test('the street-address check catches an address', () => {
  assert.ok(STREET.test('Visit us at 12 Admiralty Way, Lekki'));
  assert.ok(STREET.test('5 Bourdillon Road'));
  assert.ok(!STREET.test('Lagos, Nigeria'));
  assert.ok(!STREET.test('13+ years of shipping software'));
});
