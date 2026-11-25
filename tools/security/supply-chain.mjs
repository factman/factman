// Supply-chain checks (SEC, ETE-130), run in CI's static job:
//   node tools/security/supply-chain.mjs [--report licences.md]
//
// 1. Lockfile integrity: every package in pnpm-lock.yaml has an integrity hash, so
//    `pnpm install --frozen-lockfile` verifies each tarball it downloads.
// 2. Licences: every production dependency (what ships to visitors) uses a permissive licence on
//    the allow-list. Development tools may use others (LGPL, MPL, OFL fonts…); they are listed in
//    the report but never shipped.
// 3. Report: with --report, writes a Markdown licence report (production and all dependencies).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

/** Licences a production dependency may use (SPDX ids; an expression passes if any OR branch does). */
export const ALLOWED = new Set([
  'MIT',
  'MIT-0',
  'ISC',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'CC0-1.0',
  'BlueOak-1.0.0',
  'Unlicense',
]);

/**
 * Whether an SPDX expression is allowed: `MIT`, `(MIT OR GPL-3.0)` (one branch suffices) or
 * `(MIT AND Zlib)` (every part must be allowed).
 */
export function licenceAllowed(expression, allowed = ALLOWED) {
  const text = expression.trim().replace(/^\((.*)\)$/, '$1');
  if (/\s+OR\s+/.test(text)) return text.split(/\s+OR\s+/).some((p) => licenceAllowed(p, allowed));
  if (/\s+AND\s+/.test(text))
    return text.split(/\s+AND\s+/).every((p) => licenceAllowed(p, allowed));
  return allowed.has(text);
}

/** Lockfile packages whose resolution has no integrity hash. */
export function missingIntegrity(lockfile) {
  return lockfile
    .split('\n')
    .filter((line) => /^\s+resolution: \{/.test(line) && !line.includes('integrity:'))
    .map((line) => line.trim());
}

/** `pnpm licenses list --json` as [{ licence, name, versions }]. */
function licences(prod) {
  const args = ['licenses', 'list', '--json', ...(prod ? ['--prod'] : [])];
  const json = JSON.parse(execFileSync('pnpm', args, { encoding: 'utf8', maxBuffer: 64 << 20 }));
  return Object.entries(json).flatMap(([licence, pkgs]) =>
    pkgs.map((p) => ({ licence, name: p.name, versions: p.versions ?? [] })),
  );
}

function report(prod, all) {
  const counts = (list) =>
    Object.entries(
      list.reduce((acc, p) => ({ ...acc, [p.licence]: (acc[p.licence] ?? 0) + 1 }), {}),
    ).sort(([a], [b]) => a.localeCompare(b));
  const table = (rows) =>
    ['| Licence | Packages |', '| --- | --- |', ...rows.map(([l, n]) => `| ${l} | ${n} |`)].join(
      '\n',
    );
  return [
    '# Third-party licences',
    '',
    `Production dependencies (shipped): ${prod.length}. All dependencies: ${all ? all.length : 'not listed on this runner'}.`,
    '',
    '## Production',
    '',
    table(counts(prod)),
    '',
    ...prod
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => `- ${p.name}@${p.versions.join(', ')}: ${p.licence}`),
    '',
    ...(all
      ? ['## All dependencies (including build and test tools)', '', table(counts(all)), '']
      : []),
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failures = [];

  const unhashed = missingIntegrity(readFileSync('pnpm-lock.yaml', 'utf8'));
  if (unhashed.length)
    failures.push(`packages without an integrity hash:\n  ${unhashed.join('\n  ')}`);

  const prod = licences(true);
  const refused = prod.filter((p) => !licenceAllowed(p.licence));
  if (refused.length) {
    failures.push(
      `production dependencies with a licence not on the allow-list:\n  ${refused
        .map((p) => `${p.name}: ${p.licence}`)
        .join('\n  ')}`,
    );
  }

  const at = process.argv.indexOf('--report');
  if (at > 0) {
    // The full list is for the report only. pnpm can't list optional platform packages that this
    // OS didn't install (e.g. @emnapi on Linux), so it is best-effort; production is the gate.
    let all = null;
    try {
      all = licences(false);
    } catch (error) {
      console.warn(
        `supply-chain: all-dependency licences unavailable here (${error.message.split('\n')[0]})`,
      );
    }
    writeFileSync(process.argv[at + 1], report(prod, all));
  }

  if (failures.length) {
    console.error(`supply-chain: ${failures.join('\n')}`);
    process.exit(1);
  }
  console.log(
    `supply-chain: lockfile fully hashed; ${prod.length} production dependencies, all with allowed licences`,
  );
}
