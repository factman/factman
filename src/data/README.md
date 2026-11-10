# Data

The site's content, one JSON file per data type (PRD section 7, ADR-001). Each file has a JSON Schema (draft 2020-12) in `schemas/`.

| File | Issue |
| ---- | ----- |
| `profile.json` | ETE-27 |
| `skills.json` | ETE-28 |
| `experience.json` | ETE-29 |
| `services.json` | ETE-30 |
| `projects.json` | ETE-31 |
| `blog.json` | ETE-32 |
| `contact.json` | ETE-33 |
| `resumes.json` | ETE-34 |
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
| DS-13 | `blog.json`: https URLs, unique ids, a real `publishedAt` date, `origin` is `manual` or `rss`                                            | `blogFields`, `uniqueIds` |
| DS-14 | Generated TypeScript models are reproducible, so regenerating never changes them                                                        | `ds.test.ts`              |
| DS-15 | One deliberately broken file per case in `scripts/data/fixtures/`, each failing for that case only                                     | `ds.test.ts`              |
| DS-16 | `clients.json`: unique ids, type is `client` or `company`, https website, a name, and a logo under `src/assets/clients` that exists     | `clientEntries`, schema   |
| DS-17 | `profile.json` photo: the file exists, alt text is not empty, width and height match the file (PNG, JPEG or WebP)                       | `profilePhoto`            |

No `http://` link is allowed anywhere. The rules live in `scripts/data/rules.ts`; `pnpm test:scripts` runs the DS suite.

### Adding a broken-file fixture

Add `scripts/data/fixtures/ds-<nn>-<what>.json` with `rule` and `case`, and either:

- `data`: a small data set run through the rules (plus `assets` and `images` when the rule reads files), or
- `file` with `patch` (`replace`, `remove` or `copy` at a JSON Pointer) or `raw` text: applied to a copy of the real data and validated with the real schemas.

The suite fails if any case has no fixture, or a fixture fails for a different case too.
