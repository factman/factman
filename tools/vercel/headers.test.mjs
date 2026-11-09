// Header check (SEC): vercel.json must send the required security and cache headers.
// Run: pnpm test:headers
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const forPath = (source) => config.headers.find((h) => h.source === source)?.headers ?? [];
const value = (source, key) => forPath(source).find((h) => h.key === key)?.value;

test('build settings point at the prerendered output', () => {
  assert.equal(config.buildCommand, 'pnpm build');
  assert.equal(config.outputDirectory, 'dist/factman/browser');
});

for (const key of [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]) {
  test(`every response sends ${key}`, () => assert.ok(value('/(.*)', key)));
}

test('CSP blocks inline and third-party scripts and framing', () => {
  const csp = value('/(.*)', 'Content-Security-Policy');
  assert.match(csp, /script-src 'self';/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test('HSTS lasts at least a year', () => {
  const maxAge = Number(value('/(.*)', 'Strict-Transport-Security').match(/max-age=(\d+)/)[1]);
  assert.ok(maxAge >= 31536000);
});

test('self-hosted fonts (versioned file names) are immutable', () => {
  assert.match(value('/assets/fonts/(.*)', 'Cache-Control'), /max-age=31536000, immutable/);
});

test('hashed JS/CSS are immutable and HTML revalidates', () => {
  assert.match(value('/(.*)\\.(js|css)', 'Cache-Control'), /immutable/);
  assert.match(value('/((?!.*\\.).*)', 'Cache-Control'), /max-age=0, must-revalidate/);
});
