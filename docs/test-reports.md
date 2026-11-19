# Test reports on previews

Every preview deployment shows the test results of the commit it was built from (ETE-237), next to
the static Storybook (ETE-236). Production never serves them: on `www.factman.dev` all three paths
are the site's 404 page.

| Path          | What it shows                                                               |
| ------------- | --------------------------------------------------------------------------- |
| `/storybook`  | The UI kit's stories (ETE-220)                                              |
| `/coverage`   | Code coverage of the unit tests and the Storybook story tests, merged       |
| `/playwright` | The Playwright report: every E2E scenario in every project, with its result |

Where to find them:

- **`dev`:** `https://factman.vercel.app/coverage` and `https://factman.vercel.app/playwright`.
- **A pull request:** the `Preview deployment` job links the deployment (the "View deployment"
  button on the pull request, and the job summary).

Previews sit behind Vercel Authentication: you sign in with an account on the `eteam-apps` team.
The reports hold source code, test names, file paths and failure screenshots of the site, so keep
them there. They hold no secrets or personal data beyond what the public site already shows: the
tests read no environment values or tokens, and the only contact details are the site's own.

## Reading the reports

**Coverage** (`/coverage`): the totals at the top, then a table per folder. Open a file to see its
lines: green ran, red never ran, yellow is a branch that only went one way. `coverage-summary.json`
has the same totals for scripts.

The unit tests (`ng test`) and the story tests (Vitest browser mode) each measure coverage, and
`tools/reports/merge-coverage.mjs` combines them. The two runners build the sources differently,
so the same file comes back with different statement maps; the merge works by source line: code
counts as covered when either run covered code starting on that line.

**Playwright** (`/playwright`): one row per scenario and project (`chromium`, `firefox`,
`webkit`, `pixel`, `iphone`, plus `production`, the production-build checks). Filter by passed,
failed, flaky or skipped. A failed or retried scenario has its screenshot and, on a retry, its
trace: open it to step through the actions, network and console. Passing scenarios keep neither,
so the report stays small.

A report the run did not produce (the tests stopped before it was written) shows a short "not
available" page; the CI run for that commit has the details.

## How it is built

1. **CI tests:** the `Unit and Storybook tests` job runs `pnpm test:coverage` and uploads
   `coverage/`. The `E2E (Playwright)` job runs `pnpm e2e` (preview build, five browsers) and
   `pnpm e2e:production`, each writing a blob report, then `pnpm e2e:report` merges them into
   `playwright-report/`.
2. **Preview deploy:** the `Preview deployment` job takes the preview build from the build job,
   copies both reports into it (`tools/reports/add-reports.mjs`, which refuses a production
   build), checks the output and opens each report under its CSP (`e2e/*.reports.spec.ts`).
   Then it deploys with the Vercel CLI: `vercel build` with `FM_PREBUILT=1` (the build command
   in `vercel.json` then skips building) and `vercel deploy --prebuilt`. A push to `dev` is also
   served at `factman.vercel.app`.
3. **Production:** Vercel builds `main` itself, with `pnpm build`, which has neither Storybook
   nor reports. `ignoreCommand` in `vercel.json` skips Vercel's own build for everything else: it builds when `VERCEL_ENV` is `production` or the branch is `main`, since `VERCEL_ENV` alone did not reach that step.

The job runs whenever the build passed, even when tests failed, so a red run still has its
reports to read.

## Headers

`/coverage` and `/playwright` share one `vercel.json` rule: a CSP that allows the reports' own
inline scripts and styles, `blob:` and `data:` for the trace viewer, and nothing from other
origins; `X-Frame-Options: SAMEORIGIN`; `X-Robots-Tag: noindex, nofollow`; and no long-term
caching. The rule is `missing` on the production hosts, where a single rule gives all three tool
paths the app's strict CSP and `DENY`. `pnpm test:headers` checks both.

## Setup: the Vercel token

The deploy job needs one GitHub Actions secret, `VERCEL_TOKEN`: a Vercel access token scoped to
the `eteam-apps` team (Vercel → Account Settings → Tokens). Add it under the repository's
Settings → Secrets and variables → Actions. The team and project IDs are in the workflow; they
are not secret. Without the token the job fails with a message pointing here, and no preview is
deployed.
