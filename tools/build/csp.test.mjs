// CSP check: every inline script in the built pages is allowed by its hash, and the CSP lists no
// hash that the build no longer needs. The app and the static Storybook (ETE-220) are checked
// against their own vercel.json rules. Fix with: pnpm csp:hashes
//
// BUILD_VARIANT says which build is in dist (ETE-236): `preview` ships Storybook at /storybook,
// `production` must not, nor the test reports (ETE-237). pnpm test:build checks the preview build,
// pnpm test:build-production the production one. REPORTS=required (the preview deploy job, after
// tools/reports/add-reports.mjs) also checks /coverage and /playwright are in the preview output.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  APP_SOURCE,
  appScriptExtras,
  BUILD_VARIANT,
  DIST,
  headerRule,
  inlineScriptHashes,
  scriptSrc,
  STORYBOOK_DIR,
  STORYBOOK_SOURCE,
  storybookScriptExtras,
  storybookScriptHashes,
  TOOL_DIRS,
  TOOLS_SOURCE,
} from './inline-scripts.mjs';

assert.ok(
  ['preview', 'production'].includes(BUILD_VARIANT),
  `BUILD_VARIANT must be preview or production, not ${BUILD_VARIANT}`,
);

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const header = (rule, key) => rule.headers.find((h) => h.key === key)?.value;
const scriptSrcOf = (rule) =>
  header(rule, 'Content-Security-Policy')
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith('script-src '));

const appRule = headerRule(vercel, APP_SOURCE);
const storybookRule = headerRule(vercel, STORYBOOK_SOURCE);
const productionToolsRule = headerRule(vercel, TOOLS_SOURCE, { production: true });
const storybookDir = join(DIST, STORYBOOK_DIR);

test("the app CSP allows exactly the app's inline scripts (run pnpm csp:hashes if not)", () => {
  assert.equal(scriptSrcOf(appRule), scriptSrc(inlineScriptHashes(), appScriptExtras));
});

test('script-src never falls back to unsafe-inline, and the app never allows eval', () => {
  assert.doesNotMatch(scriptSrcOf(appRule), /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(scriptSrcOf(storybookRule), /unsafe-inline/);
});

test('on the production hosts, the tool paths get the app CSP and DENY (ETE-236, ETE-237)', () => {
  assert.equal(
    header(productionToolsRule, 'Content-Security-Policy'),
    header(appRule, 'Content-Security-Policy'),
  );
  assert.equal(header(productionToolsRule, 'X-Frame-Options'), 'DENY');
});

if (BUILD_VARIANT === 'preview') {
  test("the Storybook CSP allows exactly Storybook's inline scripts (run pnpm csp:hashes if not)", () => {
    assert.equal(
      scriptSrcOf(storybookRule),
      scriptSrc(storybookScriptHashes(), storybookScriptExtras),
    );
  });

  test('the preview build ships the static Storybook at /storybook (ETE-220)', () => {
    for (const file of ['index.html', 'iframe.html', 'index.json']) {
      assert.ok(existsSync(join(storybookDir, file)), `${storybookDir}/${file} is missing`);
    }
    // Served without a trailing slash, so the manager resolves its relative URLs from a base.
    assert.match(
      readFileSync(join(storybookDir, 'index.html'), 'utf8'),
      /<base href="\/storybook\/"/,
    );
  });

  if (process.env['REPORTS'] === 'required') {
    test('the preview deploy output has the coverage and Playwright reports (ETE-237)', () => {
      for (const dir of ['coverage', 'playwright']) {
        const index = join(DIST, dir, 'index.html');
        assert.ok(existsSync(index), `${index} is missing`);
      }
    });
  }
} else {
  test('the production build has no Storybook and no test reports (ETE-236, ETE-237)', () => {
    for (const dir of TOOL_DIRS) {
      const path = join(DIST, dir);
      assert.ok(!existsSync(path), `${path} must not exist in the production build`);
    }
  });

  test('no production page links to /storybook, /coverage or /playwright', () => {
    const pages = ['index.html', '404.html', 'services/index.html', 'projects/index.html'];
    for (const page of pages.filter((p) => existsSync(join(DIST, p)))) {
      const html = readFileSync(join(DIST, page), 'utf8');
      assert.doesNotMatch(html, /href="\/(?:storybook|coverage|playwright)(?:[/"?#])/, page);
    }
  });
}

// ETE-88: the host serves 404.html for every address with no page, so it must be the prerendered
// not-found page (tools/build/not-found-page.mjs), never a bare placeholder.
test('404.html is the prerendered not-found page, never indexed', () => {
  const page = readFileSync(join(DIST, '404.html'), 'utf8');
  assert.equal(page, readFileSync(join(DIST, '404', 'index.html'), 'utf8'));
  assert.match(page, /<h1[^>]*>command not found<\/h1>/);
  assert.match(page, /<meta name="robots" content="noindex">/);
  assert.match(page, /<script src="main-[\w-]+\.js"/);
});
