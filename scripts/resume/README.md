# Résumés: build and RS suite

`pnpm resume:html` writes each résumé's HTML; `pnpm build:resumes` prints the PDFs and page
previews into `public/resumes/` with `resumes.manifest.json` (committed); `pnpm resume:check` runs
before every build. See `docs/data-authoring.md` → "Updating the PDFs".

## RS suite (PRD §12)

Where each RS case is tested. Where the PRD and the build differ, the owner kept the build
(24 Nov 2026); those rows say what is tested instead.

| ID    | Layer       | Case                                                         | Where                                                                                 |
| ----- | ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| RS-01 | Data        | `resumes.json` schema; unknown `tracks` résumé id fails      | `scripts/data/rules.ts`, `scripts/data/ds.test.ts`                                    |
| RS-02 | Data        | No role, under 5 skills, duplicate slug or file, long text   | `scripts/data/rules.ts`, `scripts/data/ds.test.ts`                                    |
| RS-03 | Data        | `showPhone` without a phone fails                            | `scripts/data/rules.ts`, `scripts/data/ds.test.ts`                                    |
| RS-04 | Unit        | Selection: each résumé lists its own items (ETE-34)          | `src/app/data/resume.spec.ts`                                                         |
| RS-05 | Unit        | Limits (enforced by `data:validate`); earlier roles one line | `scripts/data/rules.ts`, `src/app/data/resume.spec.ts`, `template.test.ts`            |
| RS-06 | Unit        | No street address; dates formatted                           | `src/app/data/resume.spec.ts`, `template.test.ts`                                     |
| RS-07 | Unit        | `odunayo-mohammed-<slug>.pdf`, URLs, manifest, metadata      | `rs-suite.test.ts`, `manifest.test.ts`                                                |
| RS-08 | Build       | One A4 PDF per résumé, ≤ `pages.max` (3), ≤ 250 KB           | `rs-suite.test.ts`                                                                    |
| RS-09 | Build       | Text: name, email, headings in order; no placeholder or TODO | `rs-suite.test.ts`                                                                    |
| RS-10 | Build       | Fonts embedded, metadata and language set, tagged PDF        | `rs-suite.test.ts`                                                                    |
| RS-11 | Build       | Flutter only on Mobile, Kubernetes only on DevOps            | `rs-suite.test.ts`                                                                    |
| RS-12 | Build       | Previews (pages 1 and 2), sizes, manifest matches disk       | `rs-suite.test.ts`, `resume:check` in every build                                     |
| RS-13 | Build       | Only changed résumés regenerate                              | Not built: `build:resumes` reprints all three (about 4 s); `resume:check` flags stale |
| RS-14 | Build       | Two builds are identical (text, images, bytes)               | `rs-suite.test.ts`                                                                    |
| RS-15 | UI          | ResumeCard: title, scope; Preview and Download by keyboard   | `resume-card.spec.ts`, `resume-section.spec.ts`                                       |
| RS-16 | UI          | Modal: dialog, focus, Esc, backdrop, tabs, pages, skeleton   | `resume-preview-modal.spec.ts`, `dialog.spec.ts`, `e2e/resume.spec.ts`                |
| RS-17 | Integration | ResumeSection shows the cards from resumes.json and manifest | `home.spec.ts`, `resume-download.spec.ts`                                             |
| RS-18 | Integration | Deep link opens that résumé; unknown ignored                 | `e2e/resume.spec.ts`, `e2e/home.spec.ts` (`#resume=<slug>`, kept)                     |
| RS-19 | Integration | Analytics events after consent                               | Waits for the "Analytics and consent" milestone                                       |
| RS-20 | E2E         | Preview each résumé, every page, download (name, type, size) | `e2e/resume.spec.ts`                                                                  |
| RS-21 | E2E         | Hero and card open the same preview; Download from card      | `e2e/resume.spec.ts` (header and footer entry points wait for the site shell)         |
| RS-22 | E2E         | Phone: full-width preview, zoom allowed, download            | `e2e/resume.spec.ts` (pixel and iphone projects)                                      |
| RS-23 | E2E         | Downloads work without JavaScript                            | Not applicable: Download is a button (kept)                                           |
| RS-24 | Performance | No preview image before the modal opens                      | `e2e/resume.spec.ts`: page 2 images only (the cards show page 1, kept)                |

The build-layer cases read the committed PDFs with the pdfjs that `pdf-to-img` ships, and RS-14
prints them twice with Playwright's Chromium (cached in CI).
