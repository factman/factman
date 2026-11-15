# ADR-004: Per-icon imports for the icon set

- **Status:** Accepted
- **Date:** 2026-11-15
- **Issue:** ETE-69

## Context

The Factman design system ships 227 icons (222 outline icons, 5 filled brand marks) as SVG path data on a 24 × 24 grid. The full set is 48 KB, or 18 KB gzipped. Components use a handful each, and the data files choose some by name (a skill's or a service's `icon` in `src/data`). The site is prerendered, so icons must render on the server, and performance budgets (ETE-126) apply to every page.

## Options considered

1. **One SVG sprite file** (`<svg><use href="/assets/icons/sprite.svg#name">`). No icon data in JavaScript and one cached file, but every page waits on an extra request for its first icon, and the whole 18 KB loads even when a page uses three icons.
2. **Inline SVG from one map in JavaScript.** Simple to use by name, but the whole set, about 18 KB gzipped, joins the bundle of every page.
3. **Per-icon imports.** Each icon is its own exported constant, and a component imports the ones it draws. Bundles carry only those icons. Icons chosen by data have to be registered by name.

## Decision

Option 3, chosen by the owner.

- **Source:** `pnpm ds:icons` turns the vendored `src/styles/factman/icons.json` (the DS bundle's `ICONS`) into `src/app/ui/atoms/icon/icons.ts`. Each icon is one `IconDef` constant (`arrow-right` becomes `iconArrowRight`), and `IconName` is the union of all names.
- **Fixed icons:** components import the constants they draw and pass them in: `<fm-icon [icon]="arrow" />`.
- **Icons chosen by data:** the page that renders them registers them on its route with `provideIcons([...])`. `<fm-icon icon="cloud" />` then finds the icon in `IconRegistry`. An unregistered name renders nothing and warns in development.
- **Rendering:** icons render inline (`currentColor`, decorative unless labelled), so they appear in the prerendered HTML without a request.

## Consequences

- **Bundles:** each one carries only the icons its components import. A build that uses one icon contains that icon's path and no other.
- **Data icons:** a page must register every icon that its data may name. The ds:icons tests check that every `icon` in `src/data` exists in the set. A page that forgets to register one shows no icon (and a warning in development) rather than failing the build.
- **Updating the set:** `pnpm ds:icons --from <bundle.js>` updates `icons.json` and regenerates `icons.ts`. `pnpm test:scripts` fails if `icons.ts` is out of date.
