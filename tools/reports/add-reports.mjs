// Copies the test reports into the preview build, so each preview deployment shows the results of
// the commit it was built from (ETE-237): coverage/ → /coverage, playwright-report/ → /playwright.
// CI runs it in the preview deploy job, after the tests. Production never gets them: this refuses
// a production build (no Storybook in it, ETE-236) or VERCEL_ENV=production.
//
// A report the run did not produce (the tests stopped early) becomes a short page saying so, so a
// preview still deploys and the failing CI job holds the details.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DIST, STORYBOOK_DIR } from '../build/inline-scripts.mjs';

export const REPORTS = [
  { source: 'coverage', target: 'coverage', title: 'Coverage' },
  { source: 'playwright-report', target: 'playwright', title: 'Playwright report' },
];

const missingPage = (title) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${title}: not available</title>
  </head>
  <body>
    <h1>${title}: not available</h1>
    <p>This run did not produce the report. See the CI run for this commit.</p>
  </body>
</html>
`;

if (process.env['VERCEL_ENV'] === 'production') {
  console.error('add-reports: refusing a production deployment');
  process.exit(1);
}
if (!existsSync(join(DIST, STORYBOOK_DIR))) {
  console.error(
    `add-reports: ${DIST} is not the preview build (no ${STORYBOOK_DIR}/); run pnpm build:preview`,
  );
  process.exit(1);
}

for (const { source, target, title } of REPORTS) {
  const to = join(DIST, target);
  rmSync(to, { recursive: true, force: true });
  if (existsSync(join(source, 'index.html'))) {
    cpSync(source, to, { recursive: true });
    console.log(`add-reports: ${source} → ${to}`);
  } else {
    mkdirSync(to, { recursive: true });
    writeFileSync(join(to, 'index.html'), missingPage(title));
    console.warn(`add-reports: ${source}/index.html is missing; ${to} says so`);
  }
}
