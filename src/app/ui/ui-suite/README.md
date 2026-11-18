# UI suite (PRD §12, UI table)

Component interaction tests named after the PRD's UI-nn rows, so a failing case points at the
requirement it breaks. Each component's own spec covers its details; this suite checks the PRD's
promises across the kit, with the keyboard paths (Tab order, Enter and Space, Escape) and the
reduced-motion variants.

| ID    | Level              | File                        | Status                              |
| ----- | ------------------ | --------------------------- | ----------------------------------- |
| UI-01 | Atoms              | `ui-01-atoms.spec.ts`       | Covered                             |
| UI-02 | Molecules          | `ui-02-molecules.spec.ts`   | Covered                             |
| UI-03 | Organisms: code    | (with the organisms)        | Waits for CodeEditor, Terminal      |
| UI-04 | Organisms: content | (with the organisms)        | Waits for the content organisms     |
| UI-05 | Organisms: shell   | (with the organisms)        | Waits for SiteHeader, consent, form |

`pnpm test:scripts` also reports how many components at each Atomic level have a spec, a story
and an interaction test (`scripts/checks/ui-coverage.test.ts`), and fails when a component has
no spec or no story.
