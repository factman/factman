// Header check (SEC): vercel.json must send the required security and cache headers.
// Run: pnpm test:headers
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const forPath = (source) => config.headers.find((h) => h.source === source)?.headers ?? [];
const value = (source, key) => forPath(source).find((h) => h.key === key)?.value;

test('build settings point at the prerendered output', () => {
  // Production deployments build the production site; previews build the preview one (ETE-40).
  assert.match(
    config.buildCommand,
    /\$VERCEL_ENV" = production \]; then pnpm build; else pnpm build:preview;/,
  );
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
  // Own scripts, plus inline scripts allowed one by one by hash (pnpm csp:hashes); never unsafe-inline.
  assert.match(csp, /script-src 'self'( 'sha256-[A-Za-z0-9+/]+=*')*;/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-(inline|eval)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test('CSP lets only the Google Calendar scheduler load in a frame (ETE-214)', () => {
  const csp = value('/(.*)', 'Content-Security-Policy');
  const frameSrc = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith('frame-src '));
  assert.equal(frameSrc, 'frame-src https://calendar.google.com');
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
