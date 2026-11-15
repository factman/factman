# Data

The site's content, one JSON file per data type (PRD section 7, ADR-001). Each file has a JSON Schema (draft 2020-12) in `schemas/`.

**Editing content?** Start with the [data authoring guide](../../docs/data-authoring.md); every field is listed in the [field reference](../../docs/data-reference.md).

| File | Issue |
| ---- | ----- |
| `profile.json` | ETE-27 |
| `skills.json` | ETE-28 |
| `experience.json` | ETE-29 |
| `services.json` | ETE-30 |
| `projects.json` | ETE-31 |
| _(no blog file)_ | ETE-32: articles are read live from Medium; see Blog below |
| `contact.json` | ETE-33 |
| `resumes.json` | ETE-34 (résumés, canvas page 06) |
| `site.json` | ETE-35 |
| `clients.json` | ETE-36 |

## Adding or changing a file

1. Add or edit `<name>.json` here and `schemas/<name>.schema.json`. Every data file needs a schema, and every schema needs its data file.
2. Give the schema a `title`; it names the generated TypeScript type.
3. Images and files referenced in the data (`logo`, `cover`, `gallery`, `src`, `image`, `ogImage`) are paths relative to `src/assets`, and must exist.
4. Run `pnpm data:validate`. It reports each problem as `file /json/path: reason`.

`pnpm data:types` writes the TypeScript models to `src/app/shared/models/generated/` (git-ignored). Nx regenerates them before `build`, `test`, `typecheck`, `start` and Storybook, and replays them from its cache when the schemas have not changed.

## The DS suite (PRD section 12)

`pnpm data:validate` checks every file against its schema and the rules below, and tags each problem with the PRD case it breaks, e.g. `[DS-04] src/data/services.json /1/slug: duplicate slug "devops" (also at /0)`. It runs in the pre-commit hook when a data file changes, as the first CI step on every PR, and before `build`. Warnings are printed but don't fail.

| Case  | Rule                                                                                                                                    | Where                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| DS-01 | Valid JSON that matches its schema; every data file has a schema and every schema a data file; the shipped seed data passes              | schemas, `validate.ts`    |
| DS-02 | A missing required field fails, naming the file, JSON path and reason                                                                   | schemas                   |
| DS-03 | A value outside its enum fails                                                                                                          | schemas                   |
| DS-04 | `id` and `slug` are unique in every list (and roles across `experience.json`); string ids and slugs are kebab-case                      | `uniqueIds`               |
| DS-05 | `roles[].skills` and `projects[].stack` name skills in `skills.json`; every `tracks` value is a résumé id in `resumes.json`             | `skillReferences`, `trackReferences` |
| DS-06 | Role and project dates are `YYYY-MM` or `YYYY-MM-DD`; nothing ends before it starts; roles in one organization don't overlap (a role may start in the month the last one ended) | `dateFormat`, `dateOrder`, `roleOverlap` |
| DS-07 | A private project has no `links.live` or `links.source`; a public project with neither link is a warning                               | `privateProjects`, `publicProjectLinks` |
| DS-08 | At most 6 featured projects                                                                                                             | `featuredProjects`        |
| DS-09 | Referenced images (`logo`, `cover`, `gallery`, `src`, `image`, `ogImage`) exist under `src/assets`                                      | `assetsExist`             |
| DS-10 | `summary` at most 200 characters, `excerpt` at most 280                                                                                 | `textLengths`, schemas    |
| DS-11 | `contact.json`: email is an address, phone is E.164 (`+234…`), WhatsApp is digits only                                                 | `contactFormats`          |
| DS-12 | `site.json`: `gtmId` matches `^GTM-[A-Z0-9]+$`, `ga4Id` matches `^G-[A-Z0-9]+$` (or null), `consent.version` is an integer               | `siteSettings`, schema    |
| DS-13 | Retired: there is no `blog.json`; articles come live from Medium (ETE-32) | — |
| DS-14 | Generated TypeScript models are reproducible, so regenerating never changes them                                                        | `ds.test.ts`              |
| DS-15 | One deliberately broken file per case in `scripts/data/fixtures/`, each failing for that case only                                     | `ds.test.ts`              |
| DS-16 | `clients.json`: unique ids, type is `client` or `company`, https website, a name, and a logo under `src/assets/clients` that exists     | `clientEntries`, schema   |
| DS-17 | `profile.json` photos (hero, About, contact): the file exists, alt text is not empty, width and height match the file (PNG, JPEG or WebP) | `profilePhoto`            |
| RS-01 | `resumes.json` passes its schema; highlight `tracks`, roles, organizations, projects, skills, contact links and `{since:…}` exist; a role is listed once; every `[placeholder]` is declared and every declared one is used | `trackReferences`, `resumeChecks`, schema |
| RS-02 | At least 1 role and 5 skills per résumé; `limits`; unique id, slug and file name; summary at most 500 and scope at most 90 characters | `resumeChecks`, `uniqueIds`, schema |
| RS-03 | `showPhone: true` needs a phone in `contact.json`                                                                                      | `resumeChecks`            |

No `http://` link is allowed anywhere. The rules live in `scripts/data/rules.ts`; `pnpm test:scripts` runs the DS suite.

### Adding a broken-file fixture

Add `scripts/data/fixtures/ds-<nn>-<what>.json` with `rule` and `case`, and either:

- `data`: a small data set run through the rules (plus `assets` and `images` when the rule reads files), or
- `file` with `patch` (`replace`, `remove` or `copy` at a JSON Pointer) or `raw` text: applied to a copy of the real data and validated with the real schemas.

The suite fails if any case has no fixture, or a fixture fails for a different case too.

## Editing a résumé

The three résumés (Fullstack, Mobile, DevOps / Cloud) are built only from these files; the generator holds no résumé content. To change one, edit the data and run `pnpm data:validate`:

| To change                                                    | Edit                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Headline, profile paragraph, skill groups, file name         | the résumé in `resumes.json`                                                                                                         |
| Which roles appear, their order, the one-line earlier roles | `experience.roles` (role ids; `{ "merge": [...] }` shows several roles of one organization as one entry) and `experience.earlier`. Roles in neither list are left out. |
| A role's bullets on one résumé                               | `experience.json`: a highlight `{ "text": "…", "tracks": ["mobile"] }` shows only on that résumé. A résumé with no tagged bullets for a role shows the role's plain-string highlights, which are also the site's. |
| Stack lines, selected projects                               | `experience.stacks` and `projects` in the résumé. A project entry without `name`, `description` or `tech` uses the project's title, summary and stack from `projects.json`. |
| Name, contact line, education, languages, publications, press | `profile.json`, `contact.json` and `site.json`, shared with the site                                                               |
| Companies and clients                                        | `clients.json`: every client and company except the employers in `experience.json`, clients first                                    |

Skill items are `{ "skill": "<id>" }` (shows the skill's name, or "Name (since YYYY)" with `"since": true`) or plain text.

Text can use `{years}` (whole years since `profile.careerStart`, the "13+"), `{since:<skill id>}` (that skill's start year) and `[placeholders]`. Every `[placeholder]` must have an entry in `resumes.json` `placeholders`; put the figure in its `value` and the generator swaps it in. Until then the token stays in the text and previews highlight it.

## Blog

There is no blog data file. The site reads the Medium feed (`site.json` → `blog.feed`) live in the visitor's browser through the same-origin path `blog.feedPath`: `vercel.json` rewrites it to Medium in production, and `proxy.conf.json` does the same for `pnpm start`, because Medium's feed sends no CORS header. The parsed articles are kept in `localStorage` (`fm_blog`) for `blog.cacheHours` (12 hours), and covers load from Medium's own image URLs. Prerendered pages show a loading state with a link to Medium, and the list fills in in the browser. `BlogRepository` in `@core/data` does the fetching and caching.
