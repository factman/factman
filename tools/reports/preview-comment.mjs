// The pull request comment for a preview deployment (ETE-240): the CI preview job posts it after
// the deploy and updates the same comment on every push (MARKER finds it).
//
// It is public, so it holds only what anyone reading the pull request may see: the preview and
// report links, the commit and branch, the CI job results, the coverage totals, the deploy time and
// the CI run. Never tokens, secrets or the Vercel team and project IDs. The previews themselves need
// a Vercel team login (Vercel Authentication), so the links reveal nothing to the public.
//
// CLI: `node tools/reports/preview-comment.mjs` prints the Markdown, from these environment values:
// PREVIEW_URL, SHA, BRANCH, REPOSITORY, RUN_URL, RUN_NUMBER, RESULT_STATIC, RESULT_TEST,
// RESULT_BUILD, RESULT_E2E, and coverage/coverage-summary.json when the tests wrote it.
import { existsSync, readFileSync } from 'node:fs';

/** The first line of the comment, hidden in GitHub's view; the job finds its comment by it. */
export const MARKER = '<!-- fm-preview-deployment -->';

/** The CI jobs the comment reports, in pipeline order (names as in .github/workflows/ci.yml). */
export const JOBS = [
  ['static', 'Lint and typecheck'],
  ['test', 'Unit and Storybook tests'],
  ['build', 'Build (prerender)'],
  ['e2e', 'E2E (Playwright)'],
];

const RESULT = {
  success: '✅ Passed',
  failure: '❌ Failed',
  cancelled: '⏹️ Cancelled',
  skipped: '⏭️ Skipped',
};

/** A GitHub job result (`needs.<job>.result`) as words with an icon. */
export const resultText = (result) => RESULT[result] ?? `❔ ${result || 'Unknown'}`;

const METRICS = ['statements', 'branches', 'functions', 'lines'];

/** `97.15% (3588 / 3693)`, or a dash when the metric is missing. */
const metric = (m) => (m && Number.isFinite(m.pct) ? `${m.pct}% (${m.covered} / ${m.total})` : '–');

/** Escapes text for a Markdown table cell or inline code: no pipes, backticks or line breaks. */
const cell = (text) => String(text).replace(/[|`\r\n]/g, ' ');

/**
 * The comment's Markdown.
 * @param {object} info
 * @param {string} info.url The preview deployment URL (https://…vercel.app).
 * @param {string} info.sha The commit the preview was built from.
 * @param {string} info.branch
 * @param {string} info.repository `owner/name`.
 * @param {string} info.runUrl The CI run's URL.
 * @param {string|number} info.runNumber
 * @param {Record<string, string>} info.results `needs.<job>.result` by job id.
 * @param {object} [info.coverage] coverage-summary.json's `total`, when there is one.
 * @param {Date} info.deployedAt
 */
export function previewComment({
  url,
  sha,
  branch,
  repository,
  runUrl,
  runNumber,
  results,
  coverage,
  deployedAt,
}) {
  if (!/^https:\/\/[\w.-]+$/.test(url))
    throw new Error(`preview-comment: not a deployment URL: ${url}`);
  const short = sha.slice(0, 7);
  const commit = `https://github.com/${repository}/commit/${sha}`;
  const time = deployedAt
    .toISOString()
    .replace('T', ' ')
    .replace(/:\d{2}\.\d{3}Z$/, ' UTC');
  const failed = JOBS.filter(([id]) => results[id] && results[id] !== 'success');

  const lines = [
    MARKER,
    '## Preview deployment',
    '',
    `**[Open the preview](${url})** of [\`${short}\`](${commit}) on \`${cell(branch)}\`.`,
    '',
    '| Page | Link |',
    '| --- | --- |',
    `| Site | ${url} |`,
    `| Storybook | ${url}/storybook |`,
    `| Code coverage | ${url}/coverage |`,
    `| Playwright report | ${url}/playwright |`,
    '',
    '### Checks',
    '',
    '| Job | Result |',
    '| --- | --- |',
    ...JOBS.map(([id, name]) => `| ${name} | ${resultText(results[id])} |`),
    '',
  ];
  if (failed.length) {
    lines.push(
      `> [!WARNING]`,
      `> ${failed.map(([, name]) => name).join(', ')} did not pass. The preview still deployed; see the [CI run](${runUrl}).`,
      '',
    );
  }
  lines.push('### Coverage', '');
  if (coverage) {
    lines.push(
      '| Statements | Branches | Functions | Lines |',
      '| --- | --- | --- | --- |',
      `| ${METRICS.map((m) => metric(coverage[m])).join(' | ')} |`,
    );
  } else {
    lines.push('No coverage report for this run: the tests stopped before writing it.');
  }
  lines.push(
    '',
    `<sub>Deployed ${time} by [CI run #${runNumber}](${runUrl}). Previews need a Vercel team login. ` +
      'This comment updates on every push.</sub>',
    '',
  );
  return lines.join('\n');
}

/** coverage-summary.json's totals, or undefined when the file is missing or unreadable. */
export function readCoverage(file = 'coverage/coverage-summary.json') {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, 'utf8')).total;
  } catch {
    return undefined;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = process.env;
  process.stdout.write(
    previewComment({
      url: env['PREVIEW_URL'] ?? '',
      sha: env['SHA'] ?? '',
      branch: env['BRANCH'] ?? '',
      repository: env['REPOSITORY'] ?? '',
      runUrl: env['RUN_URL'] ?? '',
      runNumber: env['RUN_NUMBER'] ?? '',
      results: Object.fromEntries(
        JOBS.map(([id]) => [id, env[`RESULT_${id.toUpperCase()}`] ?? '']),
      ),
      coverage: readCoverage(),
      deployedAt: new Date(),
    }),
  );
}
