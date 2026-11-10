// Header check (SEC): vercel.json must send the required security and cache headers.
// Run: pnpm test:headers
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const forPath = (source) => config.headers.find((h) => h.source === source)?.headers ?? [];
const value = (source, key) => forPath(source).find((h) => h.key === key)?.value;
/** Header sources: every path, the app (everything but /storybook) and the static Storybook (ETE-220). */
const ALL = '/(.*)';
const APP = '/((?!storybook(?:/|$)).*)';
const STORYBOOK = '/storybook/:path*';
const directive = (csp, name) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `));

test('build settings point at the prerendered output', () => {
  // Production deployments build the production site; previews build the preview one (ETE-40).
  assert.match(
    config.buildCommand,
    /\$VERCEL_ENV" = production \]; then pnpm build; else pnpm build:preview;/,
  );
  assert.equal(config.outputDirectory, 'dist/factman/browser');
});

for (const key of [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
]) {
  test(`every response sends ${key}`, () => assert.ok(value(ALL, key)));
}

for (const source of [APP, STORYBOOK]) {
  for (const key of ['Content-Security-Policy', 'X-Frame-Options']) {
    test(`${source} sends ${key}`, () => assert.ok(value(source, key)));
  }
}

test('the catch-all rule sets no CSP or framing header, so the app and Storybook rules never clash', () => {
  assert.equal(value(ALL, 'Content-Security-Policy'), undefined);
  assert.equal(value(ALL, 'X-Frame-Options'), undefined);
});

test('CSP blocks inline and third-party scripts and framing', () => {
  const csp = value(APP, 'Content-Security-Policy');
  // Own scripts, plus inline scripts allowed one by one by hash (pnpm csp:hashes); never unsafe-inline.
  assert.match(csp, /script-src 'self'( 'sha256-[A-Za-z0-9+/]+=*')*;/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-(inline|eval)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test('CSP lets only the Google Calendar scheduler load in a frame (ETE-214)', () => {
  const csp = value(APP, 'Content-Security-Policy');
  assert.equal(directive(csp, 'frame-src'), 'frame-src https://calendar.google.com');
  assert.equal(value(APP, 'X-Frame-Options'), 'DENY');
});

test('Storybook may frame its own preview and nothing else, and is not indexed (ETE-220)', () => {
  const csp = value(STORYBOOK, 'Content-Security-Policy');
  // Storybook's Angular renderer compiles stories at run time, so eval is allowed here (and only
  // here); inline scripts still need their hash.
  assert.match(csp, /script-src 'self' 'unsafe-eval'( 'sha256-[A-Za-z0-9+/]+=*')*;/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.equal(directive(csp, 'frame-src'), "frame-src 'self'");
  assert.equal(directive(csp, 'frame-ancestors'), "frame-ancestors 'self'");
  assert.match(csp, /object-src 'none'/);
  assert.equal(value(STORYBOOK, 'X-Frame-Options'), 'SAMEORIGIN');
  assert.match(value(STORYBOOK, 'X-Robots-Tag'), /noindex/);
});

test("Storybook's files have no content hash in their names, so they always revalidate", () => {
  assert.match(value(STORYBOOK, 'Cache-Control'), /max-age=0, must-revalidate/);
  assert.equal(
    config.headers.find((h) => h.source.endsWith('\\.(js|css)')).source,
    '/((?!storybook/).*)\\.(js|css)',
  );
});

test('HSTS lasts at least a year', () => {
  const maxAge = Number(value(ALL, 'Strict-Transport-Security').match(/max-age=(\d+)/)[1]);
  assert.ok(maxAge >= 31536000);
});

test('self-hosted fonts (versioned file names) are immutable', () => {
  assert.match(value('/assets/fonts/(.*)', 'Cache-Control'), /max-age=31536000, immutable/);
});

test('hashed JS/CSS are immutable and HTML revalidates', () => {
  assert.match(value('/((?!storybook/).*)\\.(js|css)', 'Cache-Control'), /immutable/);
  assert.match(value('/((?!.*\\.).*)', 'Cache-Control'), /max-age=0, must-revalidate/);
});
