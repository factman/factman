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

`pnpm data:types` writes the TypeScript models to `src/app/shared/models/generated/` (git-ignored). Build, test and typecheck regenerate them first.

## Rules beyond the schemas

- `id` and `slug` are unique per file (and roles across `experience.json`); string ids and slugs are kebab-case
- no `http://` links anywhere
- `projects[].stack` and roles' `skills` exist in `skills.json`
- every `tracks` value is a résumé id in `resumes.json`
- a private project has no `links.live` or `links.source`
- referenced assets exist under `src/assets`
- a role or project never ends before it starts
