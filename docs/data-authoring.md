# Editing the site's content

Everything the site says about you lives in JSON files in [`src/data/`](../src/data). Change a file, run one command to check it, commit. You never need to touch the Angular code to change content.

- **This guide:** how to make the common changes, with examples you can copy.
- **[Field reference](data-reference.md):** every field of every file, its rules and allowed values, generated from the schemas.

## The files

| File              | What it holds                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `profile.json`    | Your name, headline, hero lines, About story, photos, location, languages, education, publications, press |
| `skills.json`     | Technologies, their area and the year you started using each                                              |
| `experience.json` | Organizations and roles, with the highlights shown on the site and on each résumé                         |
| `services.json`   | The services, their process, FAQs and booking links                                                       |
| `projects.json`   | Projects for the gallery and the `/projects/<slug>` pages                                                 |
| `clients.json`    | Clients and companies for the "Worked with" strip                                                         |
| `contact.json`    | Email, phone, WhatsApp and profile links                                                                  |
| `resumes.json`    | The three downloadable résumés and their placeholder values                                               |
| `site.json`       | Site settings: URL, title, navigation, analytics IDs, cookie consent, blog feed                           |

**The blog is not a file.** Articles are read live from your Medium profile on every visit (cached in the visitor's browser for 12 hours). Publish on Medium and the site shows it; nothing to edit here. The feed settings are in `site.json` → `blog`.

## Checking your change

```bash
pnpm data:validate
```

It checks every file against its schema and the cross-file rules, and prints one line per problem:

```text
[DS-04] src/data/services.json /1/slug: duplicate slug "devops" (also at /0)
```

Read it as: **rule** · **file** · **where in the file** (a [JSON Pointer](https://datatracker.ietf.org/doc/html/rfc6901): `/1/slug` is the `slug` of the second item, counting from 0) · **what's wrong**. Fix every line and run it again. Lines starting with `warning:` are advice and don't block anything.

You can't commit or merge broken data: the same check runs in the pre-commit hook when a data file changes, as the first CI step on every pull request, and before every build.

### Common errors

| Message                                                                 | What to do                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `must have required property '…'`                                       | Add the missing field. The [field reference](data-reference.md) marks required ones.                    |
| `must be equal to one of the allowed values`                            | Use one of the values listed for that field in the reference (e.g. `status`).                           |
| `must NOT have additional properties "…"`                               | The field name is misspelled or doesn't exist; check the reference.                                     |
| `… must be kebab-case`                                                  | Ids and slugs use lowercase letters, digits and single hyphens: `my-new-project`.                       |
| `duplicate id` / `duplicate slug`                                       | Every id and slug in a file must be unique.                                                             |
| `unknown skill "…" (not in skills.json)`                                | A project `stack` or role `skills` uses an id that isn't in `skills.json`. Add the skill or fix the id. |
| `missing asset "…"`                                                     | The image path doesn't match a file under `src/assets`. Check the folder, spelling and extension.       |
| `width is … but "…" is …px`                                             | A profile photo's `width`/`height` must match the image file's real size.                               |
| `placeholder [N engineers] is not declared …`                           | A résumé text uses a `[token]` with no entry in `resumes.json` → `placeholders`.                        |
| `ends (…) before it starts (…)` / `overlaps … in the same organization` | Fix the dates. Two roles at one organization may share a month (a promotion) but not overlap further.   |

## Common changes

### Add a project

Add an object to `projects.json`. The `stack` items are skill ids from `skills.json`; dates are `YYYY-MM`, or `YYYY` when you don't know the month.

<!-- example: projects -->

```json
{
  "id": "shop-api",
  "slug": "shop-api",
  "title": "Shop API",
  "summary": "Order and inventory API for an online shop.",
  "category": "API",
  "status": "maintained",
  "visibility": "public",
  "featured": false,
  "stack": ["nodejs", "postgresql"],
  "role": "Lead engineer",
  "startedAt": "2025-03",
  "links": { "source": "https://github.com/factman/shop-api" }
}
```

- **Featured:** at most 6 projects can have `"featured": true`; they fill the home page grid, newest first.
- **Private client work:** set `"visibility": "private"`, leave `links` empty (a private project must not link out) and say how people can see it with `engage`:

<!-- example: projects -->

```json
{
  "id": "payments-dashboard",
  "slug": "payments-dashboard",
  "title": "Payments dashboard",
  "summary": "Merchant dashboard for a payments client. Under NDA.",
  "category": "Fintech",
  "status": "completed",
  "visibility": "private",
  "featured": false,
  "stack": ["angular", "nodejs"],
  "startedAt": "2024",
  "completedAt": "2024-11",
  "links": {},
  "engage": { "mode": "request-demo", "note": "Code is under NDA; a walkthrough is available." }
}
```

- **Images (optional):** put a cover at `src/assets/projects/<id>/cover.webp` and set `"cover": "projects/<id>/cover.webp"`; extra screenshots go in `gallery` the same way.

Each project gets its own page at `/projects/<slug>`, built automatically.

### Add a skill

<!-- example: skills -->

```json
{
  "id": "go",
  "name": "Go",
  "category": "Backend",
  "since": 2026,
  "featured": false,
  "icon": "file-code"
}
```

`since` is the year you started; the site shows the years itself, so it never goes out of date. Leave `since` out if you don't know it. `featured` skills are listed first in their area. `icon` is a design-system icon name; reuse one from an existing skill (`braces`, `file-code`, `layout`, `server`, `mobile`, `database`, `cloud`, `package`, `workflow`, `terminal`, `git-branch`, …).

A new skill doesn't appear on a résumé until you add it to that résumé's `skillGroups` (see [Résumés](#résumés)).

### Add a role or an organization

Roles live inside their organization in `experience.json`. A role with no `end` is current. The site sorts the timeline itself (current roles first, then newest), so the order in the file doesn't matter.

<!-- example: experience -->

```json
{
  "id": "acme",
  "organization": "Acme",
  "website": "https://acme.example",
  "roles": [
    {
      "id": "acme-cto",
      "title": "Chief Technology Officer",
      "type": "full-time",
      "location": "Lagos, Nigeria",
      "start": "2026-06",
      "summary": "Lead technology strategy and the engineering team.",
      "highlights": [
        "Set the technology strategy and roadmap",
        { "text": "Moved the platform to containerised CI/CD", "tracks": ["devops"] }
      ],
      "skills": ["nodejs", "docker"]
    }
  ]
}
```

- **`highlights`:** plain strings are shown on the site. An object with `tracks` is a bullet for those résumés only (`fullstack`, `mobile`, `devops`); see [Résumés](#résumés).
- **Promotion at the same organization:** add another role to the same `roles` list. The new role may start in the month the old one ended.
- **`legalName`:** set it when résumés should show a longer registered name (e.g. "Simple Finance Company Limited") while the site keeps the short `organization` name.
- **`brief`:** one line used when a résumé lists the role under "Earlier experience".

### Add a client or company logo

1. Save the logo in `src/assets/clients/` with a kebab-case name, e.g. `acme.png` (SVG, PNG or WebP; transparent background, cropped to the artwork).
2. Add an entry to `clients.json`:

<!-- example: clients -->

```json
{
  "id": 16,
  "order": 16,
  "slug": "acme",
  "name": "Acme",
  "type": "client",
  "website": "https://acme.example",
  "logo": "clients/acme.png",
  "plate": "light",
  "ratio": 3.2
}
```

- `type` is `client` (you worked for them) or `company` (you worked at them).
- `plate` is the background the logo sits on: `dark` for white artwork, otherwise `light`.
- `ratio` is the logo's width divided by its height (a 640 × 200 image is `3.2`); it reserves space so the page doesn't jump while logos load.
- Clients who are also employers in `experience.json` (same slug as the organization id) are left out of the résumés' "Companies and clients" line automatically.

### Add or change a service

Copy an existing service in `services.json`, then change its `id`, `slug`, `title`, `summary`, `order` and the content. The booking links (`booking`) are prefilled per service: keep the scheduler URL, and change the service name inside the email subject and WhatsApp text. Each service gets its page at `/services/<slug>`.

### Update contact details

Edit `contact.json`. Phone is in international format (`+2347066780373`); the WhatsApp number is digits only (`2347066780373`). Only a city and country are stored, never a street address. To add a profile link, add `{ "id", "label", "url", "handle" }` to `links`.

### Change your photos

The hero, About and contact photos are in `src/assets/profile/` and described in `profile.json` (`photo`, `aboutPhoto`, `contactPhoto`). After replacing an image, update its `width` and `height` to the new file's pixel size and check the `alt` text still describes it; validation fails if the size doesn't match the file.

### Site settings

`site.json` holds the navigation (`nav`), the Google Tag Manager and GA4 ids (`analytics`), the cookie banner text and categories (`consent`) and the default theme. **When you change what is stored or tracked, increase `consent.version` by 1**: visitors are then asked for their consent again.

## Résumés

The three résumés (Fullstack, Mobile, DevOps / Cloud) are built only from the data files, so editing a résumé never needs code.

| To change                                                     | Edit                                                                                                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headline, profile paragraph, file name                        | the résumé in `resumes.json`                                                                                                                                                                  |
| Skills and their grouping                                     | `skillGroups`: each item is `{ "skill": "<id>" }` (shows its name; add `"since": true` for "Name (since YYYY)") or plain text                                                                 |
| Which roles appear and in what order                          | `experience.roles` (role ids; `{ "merge": ["id-1", "id-2"] }` shows two roles at one organization as one entry) and `experience.earlier` (one line each). Roles in neither list are left out. |
| A role's bullets on one résumé                                | `experience.json`: add `{ "text": "…", "tracks": ["mobile"] }` to the role's `highlights`. A résumé with no bullets of its own for a role shows the role's plain-string highlights.           |
| Stack lines and selected projects                             | `experience.stacks` and `projects`. A project entry with only `"project": "<id>"` uses that project's title, summary and stack.                                                               |
| Name, contact line, education, languages, publications, press | `profile.json`, `contact.json`, `site.json` (shared with the site)                                                                                                                            |
| Companies and clients                                         | `clients.json` (every client and company except your employers, clients first)                                                                                                                |

Text can use:

- `{years}`: your years of experience, computed from `profile.careerStart` (so "13+" updates itself);
- `{since:<skill id>}`: the year you started a skill, e.g. `{since:ionic}`;
- `[placeholders]`: figures you'll supply later, such as `[N engineers]`. Every placeholder has an entry in `resumes.json` → `placeholders`; put the real figure in its `value` and every résumé using it updates.

### Updating the PDFs

The downloadable PDFs and their preview images are committed in `public/resumes/`. After changing anything a résumé shows (the files in the table above), print them again and commit the result:

```bash
pnpm build:resumes
```

Every build checks that the committed PDFs match the data (`pnpm resume:check`) and fails if they don't, or if a PDF has more pages than the résumé's `pages.max`. The production build (Vercel, `main`) also fails while any `[placeholder]` is still unfilled; preview builds allow them.

## Images

| Where                                        | Format                         | Size                                        | Alt text                     |
| -------------------------------------------- | ------------------------------ | ------------------------------------------- | ---------------------------- |
| Profile photos (`src/assets/profile/`)       | WebP (JPEG or PNG work)        | Hero and About 720 × 900; contact 900 × 507 | Required; describe the photo |
| Client logos (`src/assets/clients/`)         | SVG, else PNG or WebP          | At least 2× the display height; cropped     | The client `name` is used    |
| Project images (`src/assets/projects/<id>/`) | WebP                           | Covers 1200 px wide                         | From the project title       |
| Blog covers                                  | not stored: Medium serves them | —                                           | —                            |

All paths in the data are relative to `src/assets`, without a leading slash (`clients/acme.png`). Validation fails if a referenced image doesn't exist.

## For developers

- Adding a field means changing the file's schema in `src/data/schemas/`; run `pnpm data:types` for the TypeScript models and `pnpm data:docs` to regenerate the [field reference](data-reference.md) (`pnpm test:scripts` fails until you do).
- The validation rules and their PRD case ids (DS-01 to DS-17, RS-01 to RS-03) are listed in [`src/data/README.md`](../src/data/README.md).
