// Header check (SEC): vercel.json must send the required security and cache headers.
// Run: pnpm test:headers
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
/** The production domains (factman.dev, www.factman.dev): no Storybook (ETE-236), no reports (ETE-237). */
const PRODUCTION_HOST = { type: 'host', value: { suf: 'factman.dev' } };
const onProductionHost = (h) =>
  (h.has ?? []).some((c) => c.value?.suf === PRODUCTION_HOST.value.suf);
/** The rule for a source: the production-host one, or the one that is not limited to those hosts. */
const ruleFor = (source, { production = false } = {}) =>
  config.headers.find((h) => h.source === source && onProductionHost(h) === production);
const forPath = (source, options) => ruleFor(source, options)?.headers ?? [];
const value = (source, key) => forPath(source).find((h) => h.key === key)?.value;
/**
 * Header sources: every path, the app (everything but the tool paths), the static Storybook
 * (ETE-220), the test reports (ETE-237), and the tool paths on the production hosts (ETE-236).
 */
const ALL = '/(.*)';
const APP = '/((?!(?:storybook|coverage|playwright)(?:/|$)).*)';
const STORYBOOK = '/storybook/:path*';
const REPORTS = '/:report(coverage|playwright)/:path*';
const TOOLS = '/:tool(storybook|coverage|playwright)/:path*';
const directive = (csp, name) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `));

test('build settings point at the prerendered output', () => {
  // Production deployments build the production site; previews build the preview one (ETE-40).
  // CI deploys previews prebuilt, with the reports in them (FM_PREBUILT, ETE-237).
  assert.match(
    config.buildCommand,
    /^if \[ -n "\$FM_PREBUILT" \]; then .*; elif \[ "\$VERCEL_ENV" = production \]; then pnpm build; else pnpm build:preview; fi$/,
  );
  assert.equal(config.outputDirectory, 'dist/factman/browser');
});

test('Vercel builds production only; CI deploys every preview (ETE-237)', () => {
  // The Ignored Build Step skips a Git build when the command exits 0. VERCEL_ENV alone is not
  // enough: it was not "production" in that step, so v0.1.0-beta.2's production build was skipped.
  // Production deploys from main, so either signal keeps the build.
  assert.equal(
    config.ignoreCommand,
    '[ "$VERCEL_ENV" != production ] && [ "$VERCEL_GIT_COMMIT_REF" != main ]',
  );
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

for (const source of [APP, STORYBOOK, REPORTS]) {
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
  // Own scripts, Google Tag Manager (loaded only after consent, ETE-120), plus inline scripts allowed
  // one by one by hash (pnpm csp:hashes); never unsafe-inline.
  assert.match(
    csp,
    /script-src 'self' https:\/\/www\.googletagmanager\.com( 'sha256-[A-Za-z0-9+/]+=*')*;/,
  );
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-(inline|eval)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test("CSP enforces Trusted Types, with only Angular's, JSON-LD, feed, Google tag and Vercel insights policies (ETE-267, ETE-270, ETE-120, ETE-271)", () => {
  const csp = value(APP, 'Content-Security-Policy');
  assert.equal(directive(csp, 'require-trusted-types-for'), "require-trusted-types-for 'script'");
  // fm-gtm sets GTM's script URL; goog#html is the policy Google's gtm.js and gtag.js create for
  // the scripts they add themselves; fm-vercel-insights sets /_vercel/insights/script.js.
  // 'allow-duplicates': each Google script on the page (gtm.js, Tag Assistant's preview, a tag's
  // own library) creates its own goog#html, and a CSP can't allow that for one name only. Our own
  // policies are still created once per window.
  assert.equal(
    directive(csp, 'trusted-types'),
    "trusted-types angular angular#bundler fm-json-ld fm-feed-html fm-gtm goog#html fm-vercel-insights 'allow-duplicates'",
  );
});

test('CSP lets GA4 send its hits through GTM; Vercel Web Analytics stays same-origin (ETE-120, ETE-271)', () => {
  const csp = value(APP, 'Content-Security-Policy');
  const google = 'https://*.google-analytics.com https://*.googletagmanager.com';
  assert.equal(
    directive(csp, 'connect-src'),
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  );
  assert.ok(directive(csp, 'img-src').endsWith(google));
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

for (const source of [STORYBOOK, REPORTS]) {
  test(`${source} never applies on the production hosts (ETE-236, ETE-237)`, () => {
    assert.deepEqual(ruleFor(source).missing, [PRODUCTION_HOST]);
    assert.equal(ruleFor(source).has, undefined);
  });
}

test('on the production hosts, every tool path gets the app CSP and DENY (ETE-236, ETE-237)', () => {
  const production = (key) =>
    forPath(TOOLS, { production: true }).find((h) => h.key === key)?.value;
  assert.deepEqual(ruleFor(TOOLS, { production: true }).has, [PRODUCTION_HOST]);
  assert.equal(production('Content-Security-Policy'), value(APP, 'Content-Security-Policy'));
  assert.equal(production('X-Frame-Options'), 'DENY');
  assert.doesNotMatch(directive(production('Content-Security-Policy'), 'script-src'), /unsafe-/);
});

test('the reports may run their own inline scripts, framed only by the site, and are not indexed (ETE-237)', () => {
  const csp = value(REPORTS, 'Content-Security-Policy');
  // The Playwright report and the coverage HTML are generated pages with inline scripts and
  // styles; the trace viewer uses a service worker and blob: URLs. Nothing loads from elsewhere.
  assert.equal(directive(csp, 'script-src'), "script-src 'self' 'unsafe-inline'");
  assert.equal(directive(csp, 'connect-src'), "connect-src 'self' data: blob:");
  assert.equal(directive(csp, 'frame-ancestors'), "frame-ancestors 'self'");
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /https?:/);
  assert.equal(value(REPORTS, 'X-Frame-Options'), 'SAMEORIGIN');
  assert.equal(value(REPORTS, 'X-Robots-Tag'), 'noindex, nofollow');
  assert.match(value(REPORTS, 'Cache-Control'), /max-age=0, must-revalidate/);
});

test("Storybook's files have no content hash in their names, so they always revalidate", () => {
  assert.match(value(STORYBOOK, 'Cache-Control'), /max-age=0, must-revalidate/);
  assert.equal(
    config.headers.find((h) => h.source.endsWith('\\.(js|css)')).source,
    '/((?!(?:storybook|coverage|playwright)/).*)\\.(js|css)',
  );
});

test('the blog feed path rewrites to the Medium feed in site.json (ETE-32)', () => {
  const site = JSON.parse(
    readFileSync(new URL('../../src/data/site.json', import.meta.url), 'utf8'),
  );
  const rewrite = config.rewrites.find((r) => r.source === site.blog.feedPath);
  assert.ok(rewrite, `no rewrite for ${site.blog.feedPath}`);
  assert.equal(rewrite.destination, site.blog.feed);
});

test('the CSP lets blog covers load from Medium, and only images', () => {
  const csp = value(APP, 'Content-Security-Policy');
  assert.match(
    directive(csp, 'img-src'),
    /^img-src 'self' data: https:\/\/cdn-images-1\.medium\.com https:\/\/miro\.medium\.com /,
  );
  assert.doesNotMatch(directive(csp, 'connect-src'), /medium/);
});

test('HSTS lasts at least a year', () => {
  const maxAge = Number(value(ALL, 'Strict-Transport-Security').match(/max-age=(\d+)/)[1]);
  assert.ok(maxAge >= 31536000);
});

test('self-hosted fonts (versioned file names) are immutable', () => {
  assert.match(value('/assets/fonts/(.*)', 'Cache-Control'), /max-age=31536000, immutable/);
});

test('hashed JS/CSS are immutable and HTML revalidates', () => {
  assert.match(
    value('/((?!(?:storybook|coverage|playwright)/).*)\\.(js|css)', 'Cache-Control'),
    /immutable/,
  );
  assert.match(value('/((?!.*\\.).*)', 'Cache-Control'), /max-age=0, must-revalidate/);
});
