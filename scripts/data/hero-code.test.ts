import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { HERO_CODE_FILE, heroCode, heroCodeModule } from './generate-hero-code';

const root = process.cwd();

test('the hero code is the profile object from the data', () => {
  const profile = JSON.parse(readFileSync('src/data/profile.json', 'utf8'));
  const { code, highlightLines } = heroCode(root);
  const lines = code.split('\n');
  assert.equal(lines[0], 'const profile = {');
  assert.ok(code.includes(`name: ${JSON.stringify(profile.name)},`));
  assert.ok(code.includes(`role: ${JSON.stringify(profile.headline)},`));
  assert.ok(code.includes(`since: ${profile.careerStart.slice(0, 4)},`));
  assert.match(lines[highlightLines[0] - 1], /^ {2}stack: \[".+"\],$/);
});

test('the stack is the newest featured Frontend, Backend and Languages skill', () => {
  assert.ok(heroCode(root).code.includes('stack: ["Angular", "Node.js", "TypeScript"],'));
});

test(`${HERO_CODE_FILE} is up to date with the data (run pnpm data:hero-code)`, () => {
  assert.equal(readFileSync(HERO_CODE_FILE, 'utf8'), heroCodeModule(root));
});
