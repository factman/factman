# Atomic Design in this codebase

The UI is built in layers. Each layer may use the layers below it and never the layers above it. ESLint (`eslint-plugin-boundaries`) enforces this, so a wrong import fails `pnpm lint`, the pre-commit hook and CI.

## Levels

| Level     | Folder                    | What belongs here                                                         | `@level` tag |
| --------- | ------------------------- | ------------------------------------------------------------------------- | ------------ |
| Tokens    | `src/app/ui/tokens`       | Colour, type, spacing and motion values. No components.                   | n/a          |
| Atoms     | `src/app/ui/atoms`        | Smallest pieces: button, icon, link, heading, badge.                      | `atom`       |
| Molecules | `src/app/ui/molecules`    | A few atoms with one job: search field, card header.                      | `molecule`   |
| Organisms | `src/app/ui/organisms`    | Page sections: site header, footer, project grid, contact form.           | `organism`   |
| Templates | `src/app/ui/templates`    | Layouts that place organisms in slots. Content comes in through inputs.   | `template`   |
| Pages     | `src/app/features/<name>` | Routed components. Fill a template with real content from the data layer. | `page`       |

Supporting folders:

| Folder           | What belongs here                                                    |
| ---------------- | -------------------------------------------------------------------- |
| `src/app/core`   | App-wide services and providers, one NgModule per concern (ADR-002). |
| `src/app/shared` | Framework-agnostic helpers and types. No UI.                         |
| `src/app/data`   | JSON content, schemas and loaders (ETE-27 to ETE-39).                |

## May depend on

| From \ May import | tokens | atoms | molecules | organisms | templates | pages | shared | core | data |
| ----------------- | :----: | :---: | :-------: | :-------: | :-------: | :---: | :----: | :--: | :--: |
| **atoms**         |   ✅   |  ✅¹  |           |           |           |       |        |      |      |
| **molecules**     |   ✅   |  ✅   |    ✅¹    |           |           |       |   ✅   |      |      |
| **organisms**     |   ✅   |  ✅   |    ✅     |    ✅¹    |           |       |   ✅   |      |      |
| **templates**     |   ✅   |  ✅   |    ✅     |    ✅     |    ✅¹    |       |   ✅   |      |      |
| **pages**         |   ✅   |  ✅   |    ✅     |    ✅     |    ✅     |  ✅   |   ✅   |  ✅  |  ✅  |
| **core**          |        |       |           |           |           |       |   ✅   |  ✅  |  ✅  |
| **data**          |        |       |           |           |           |       |   ✅   |      |      |
| **shared**        |        |       |           |           |           |       |        |      |      |

¹ Within the same level, for example one atom composing another. Prefer composition at the level above.

Key rules:

- **Pages are the only UI level that reads the data layer.** Templates and below get content through inputs.
- Atoms use tokens only, not even `shared`, so they stay portable to Storybook.

The source of truth is `tools/eslint/atomic-levels.mjs`. Change this table and that file together.

## Public APIs and path aliases

Every level and every feature has an `index.ts` that is its public API. Import through the alias, never through a deep path:

| Alias              | Points to                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `@ui/tokens`       | `src/app/ui/tokens/index.ts`                                                                                         |
| `@ui/atoms`        | `src/app/ui/atoms/index.ts`                                                                                          |
| `@ui/molecules`    | `src/app/ui/molecules/index.ts`                                                                                      |
| `@ui/organisms`    | `src/app/ui/organisms/index.ts`                                                                                      |
| `@ui/templates`    | `src/app/ui/templates/index.ts`                                                                                      |
| `@features/<name>` | `src/app/features/<name>/index.ts`                                                                                   |
| `@core`            | `src/app/core/index.ts` (`CoreModule`)                                                                               |
| `@core/<concern>`  | `src/app/core/<concern>/index.ts`                                                                                    |
| `@shared`          | `src/app/shared/index.ts`                                                                                            |
| `@data`            | `src/app/data/index.ts`                                                                                              |
| `@data/<set>`      | `src/app/data/<set>.ts` (one data set: `site`, `services`, `clients` …), so each chunk carries only the JSON it uses |

```ts
// Good
import { Button } from '@ui/atoms';

// Bad: deep import, bypasses the public API
import { Button } from '../../ui/atoms/button/button';
```

## The `@level` tag

Every component in `ui/<level>` or `features/` carries a JSDoc tag that matches its folder. The `atomic/level-tag` lint rule checks it.

```ts
/**
 * Primary call-to-action button.
 * @level atom
 */
@Component({ selector: 'fm-button' /* … */ })
export class Button {}
```

## Adding a component

1. Pick the lowest level that fits. If it needs data, it is a page, or the page passes the data in.
2. Create `src/app/ui/<level>/<name>/<name>.ts` (plus template, styles, spec and story).
3. Add the `@level` tag.
4. Export it from the level's `index.ts`.
5. Run `pnpm lint`.

## How the rule is tested

`tools/eslint/fixtures` holds files that break each rule on purpose. `pnpm test:lint-rules` (part of `pnpm lint`) proves ESLint reports every one of them and accepts the valid ones.
