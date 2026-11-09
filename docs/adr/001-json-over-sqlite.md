# ADR-001: JSON over SQLite for content

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** ETE-217 (decision from ETE-18)

## Context

The site is a personal portfolio, prerendered to static HTML at build time (SSG) and served from Vercel. Its content (services, projects, profile and site settings) needs a home that the build can read, that changes can be reviewed for, and that CI can check before anything ships.

Constraints:

- Every route is prerendered (FR-01), so content is only read at build time. Nothing queries it at runtime.
- The data set is small: tens of records, not thousands.
- Content changes are made by a developer, through pull requests.

## Options considered

1. **JSON files in the repo**
   - Pros: read directly by the build; diffable and reviewable in PRs; versioned with the code; can be validated with JSON Schema (Ajv) in CI.
   - Cons: no ad-hoc queries, joins or indexes; relations have to be resolved in code.
2. **SQLite database file**
   - Pros: real queries, relations and indexes.
   - Cons: a binary file whose changes can't be reviewed in a diff; adds a database layer to a build that doesn't need one; its strengths only pay off at a scale this site doesn't have.

## Decision

Use **JSON files** for content, because:

- **Static build fit:** content is only needed at build time for prerendering, so there is no runtime database or server to run on Vercel.
- **Git-native content:** changes are diffable, reviewed in pull requests, and versioned alongside the code that renders them.
- **Schema validation:** each file has a JSON Schema, and `data:validate` (Ajv) fails CI on bad content before anything builds.
- **Small data volume:** with tens of records, SQLite's querying and indexing buy nothing.

## Consequences

- Easier: content edits go through the normal PR, CI and preview flow; no database to host, migrate or back up.
- Harder: there are no queries or joins; build-time loaders look up related records in code.
- **Revisit when** non-developers need to edit content, or the content grows to the point where it needs querying or relations. At that point, consider SQLite or a headless CMS.
