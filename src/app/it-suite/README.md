# IT suite (PRD §12, IT table)

Integration tests named after the PRD's IT-nn rows. Each case opens the app the way a visitor does:
through the real routes (`app.routes.ts`), CoreModule and the seeded JSON in `src/data`, rendered
with TestBed by `openApp()` in `it-harness.ts`. Component and page specs cover the details; this
suite checks that the pieces work together for each P0 user story.

| ID    | Case                                                     | User stories         | Status                                |
| ----- | -------------------------------------------------------- | -------------------- | ------------------------------------- |
| IT-01 | HomePage renders every section from the data, in order  | US-01, US-03, US-07  | Covered                               |
| IT-02 | Experience in FR-13 order from real data                 | US-05                | Covered                               |
| IT-03 | ProjectsPage filters sync to the URL; Back restores them | US-10                | Covered                               |
| IT-04 | ProjectDetailPage: public and private projects           | US-11, US-12         | Covered                               |
| IT-05 | ServiceDetailPage booking links carry the service        | US-08, US-09         | Covered (`service_enquiry`: IT-07)    |
| IT-06 | Contact composes the `mailto:` URL; channels listed      | US-15, US-16         | Covered (`contact_form_submit`: todo) |
| IT-07 | Accept injects GTM and `page_view`; Reject injects none  | US-17, US-18, US-19  | Todo: Analytics and consent milestone |
| IT-08 | Theme choice survives route changes                      | US-20                | Covered                               |
| IT-09 | Every slug resolves; an unknown slug shows NotFound      | US-24                | Covered                               |
| IT-10 | Title, description, canonical and JSON-LD per navigation | (SEO, FR-05)         | Covered                               |
| IT-11 | Blog lists the Medium feed with safe external links      | US-13, US-14         | Covered (blog.json → feed, ETE-32)    |
| IT-12 | StatsPanel values are aggregates of the data             | US-04                | Covered                               |

The other P0 stories are checked by their own suites:

- **US-21** (keyboard and screen reader): axe in the Storybook tests and the e2e suite, plus the UI suite's keyboard paths.
- **US-22** (reduced motion): the UI suite's reduced-motion variants and `e2e/motion.spec.ts`.
- **US-23** (invalid data fails the build): `scripts/data/validate.test.ts` in `pnpm test:scripts`.
- **US-25 to US-30** (résumés): the RS suite (ETE-110).

The `it.todo` cases are written with the analytics and consent work, in the "Analytics and
consent" milestone. Run the suite with `pnpm nx test factman`.
