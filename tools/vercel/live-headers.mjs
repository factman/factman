// Live header check (SEC, ETE-129): fetches a deployment and compares its response headers with
// the vercel.json rules for that host. The config tests (headers.test.mjs) prove what vercel.json
// says; this proves what Vercel actually serves.
//
//   node tools/vercel/live-headers.mjs https://www.factman.dev
//   node tools/vercel/live-headers.mjs https://factman-abc123.vercel.app
//
// Preview deployments are behind Vercel Authentication: set VERCEL_AUTOMATION_BYPASS_SECRET (the
// project's Protection Bypass for Automation) and it is sent as x-vercel-protection-bypass.
// --config <file> compares with another vercel.json (e.g. main's, for production before a release).
import { readFileSync } from 'node:fs';

import {
  APP_SOURCE,
  headerRule,
  STORYBOOK_SOURCE,
  TOOLS_SOURCE,
} from '../build/inline-scripts.mjs';

const args = process.argv.slice(2);
const configAt = args.indexOf('--config');
const configPath = configAt >= 0 ? args[configAt + 1] : 'vercel.json';
const base = args.find((a, i) => !a.startsWith('--') && (configAt < 0 || i !== configAt + 1));
if (!base) {
  console.error(
    'usage: node tools/vercel/live-headers.mjs <deployment url> [--config vercel.json]',
  );
  process.exit(2);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const origin = new URL(base).origin;
const production = new URL(base).hostname.endsWith('factman.dev');
const bypass = process.env['VERCEL_AUTOMATION_BYPASS_SECRET'];

/** A rule's headers as { key (lower case): value }. */
const headersOf = (rule) =>
  Object.fromEntries((rule?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]));
const host = new URL(base).hostname;
/** Whether a `has` host condition matches this host (exact value, or `{ suf }`). */
const hostMatches = (c) =>
  c.type === 'host' &&
  (typeof c.value === 'string' ? c.value === host : host.endsWith(c.value?.suf ?? '\0'));
/** The catch-all rules that apply on this host: unconditioned ones and host-matched ones. */
const every = Object.assign(
  {},
  ...config.headers
    .filter((h) => h.source === '/(.*)')
    .filter((h) => (h.has ?? []).every(hostMatches) && !(h.missing ?? []).some(hostMatches))
    .map(headersOf),
);
const app = headersOf(headerRule(config, APP_SOURCE, { production }));

/** What each path must send: every response's headers, plus the rule for that path. */
const expected = {
  '/': app,
  '/services': app,
  '/privacy': app,
  '/does-not-exist': app,
  '/storybook': production
    ? headersOf(headerRule(config, TOOLS_SOURCE, { production: true }))
    : headersOf(headerRule(config, STORYBOOK_SOURCE)),
};

const failures = [];
for (const [path, rule] of Object.entries(expected)) {
  const response = await fetch(origin + path, {
    redirect: 'manual',
    headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
  });
  if (response.status === 401 || (response.status >= 300 && response.status < 400)) {
    failures.push(
      `${path}: ${response.status} (protected? set VERCEL_AUTOMATION_BYPASS_SECRET for previews)`,
    );
    continue;
  }
  const want = { ...every, ...rule };
  for (const [key, value] of Object.entries(want)) {
    if (key === 'cache-control') continue; // Vercel adds its own on some responses
    const got = response.headers.get(key);
    if (got !== value) failures.push(`${path}: ${key}\n    want ${value}\n    got  ${got}`);
  }
}

if (failures.length) {
  console.error(`live-headers: ${origin} does not send the vercel.json headers:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `live-headers: ${origin} (${production ? 'production' : 'preview'}) sends the vercel.json headers on ${Object.keys(expected).length} paths`,
);
