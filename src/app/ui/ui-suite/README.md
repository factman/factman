# UI suite (PRD §12, UI table)

Component interaction tests named after the PRD's UI-nn rows, so a failing case points at the
requirement it breaks. Each component's own spec covers its details; this suite checks the PRD's
promises across the kit, with the keyboard paths (Tab order, Enter and Space, Escape) and the
reduced-motion variants.

| ID    | Level              | File                                | Status  |
| ----- | ------------------ | ----------------------------------- | ------- |
| UI-01 | Atoms              | `ui-01-atoms.spec.ts`               | Covered |
| UI-02 | Molecules          | `ui-02-molecules.spec.ts`           | Covered |
| UI-03 | Organisms: code    | `ui-03-organisms-code.spec.ts`      | Covered |
| UI-04 | Organisms: content | `ui-04-organisms-content.spec.ts`   | Covered |
| UI-05 | Organisms: shell   | `ui-05-organisms-shell.spec.ts`     | Covered |

UI-03 tests the CodeEditor the canvas shipped: it shows its file at once (no typed snippet to
skip), with tabs and a copy button. UI-05 tests the consent banner's `n` (Accept necessary), `a`,
`c` and Escape keys, the shipped design's replacement for the PRD's `r` (Reject).

`pnpm test:scripts` also reports how many components at each Atomic level have a spec, a story
and an interaction test (`scripts/checks/ui-coverage.test.ts`). It fails when a component has no
spec or no story, or when an organism has no interaction test: a story with a `play` function, or
a case here that renders it.
