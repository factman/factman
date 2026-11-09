# Design tokens and the Factman Design System

The site's look comes only from the [Factman Design System](https://claude.ai/artifact/BKe8bcinFg9dC6H9ChDRBm) (PRD section 6). Two files from it load globally, before `src/styles.scss` (see `angular.json` → `styles`):

| File                                | What it is                                                                                             | Source                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `src/styles/factman/tokens.css`     | Every token as a CSS custom property: Light values on `:root`, Dark overrides on `[data-theme="dark"]` | Generated from `src/styles/factman/tokens.json` by `pnpm ds:tokens` |
| `src/styles/factman/components.css` | The `fm-*` component classes (the design system's `components/bundle.css`), built on the tokens        | Copied as is                                                        |

Both are vendored: Prettier and stylelint skip them, and they are never edited by hand.

## Token layers

1. **Primitives:** raw values: `neutral-*`, `blue-*`, `red-*`, `green-*`, `amber-*`, `ice-*`, `alpha-*` (and the `legacy-*` palette kept for old frames). **Never used directly.**
2. **Semantic tokens:** what components use. Each points at a primitive and carries a Light and a Dark value:
   - ground: `bg-canvas`, `bg-surface`, `bg-sunken`, `bg-inverse` …
   - glass: `glass-fill*`, `glass-panel`, `glass-stroke*`, `glass-chrome*`, `glass-popover`
   - text, icon and border: `text-primary` … `text-tertiary`, `icon-*`, `border-*`, plus status (`danger`, `success`, `warning`, `info`)
   - data: `chart-series-1` … `chart-series-8`
3. **Component and portfolio tokens:** values for one family of components:
   - code editor: `code-*`, `syntax-*`
   - terminal (always dark): `terminal-*`
   - window chrome: `window-dot-*`
   - portfolio accents: `accent-glow`, `status-available`
   - tables and loading: `table-*`, `skeleton-*`
4. **Scales:** spacing (`gap-*`, `padding-*` on a 4px rhythm), `radius-*`, `border-width-*`, `shadow-*` (Light and Dark), `blur-*`, `opacity-*`, layout (`breakpoint-*`, `content-max`, `navbar-height`), motion (`duration-*`, `ease-*`) and fonts (`font-sans`, `font-logo`, `font-mono`).

Dark mode: set `data-theme="dark"` on `<html>` (theme handling is ETE-24). Wrap pages in `.fm-backdrop` for the canvas glow that makes glass read.

## Rules for component styles

`pnpm lint:styles` (stylelint, also part of `pnpm lint` and the pre-commit hook) rejects:

- hex colours, named colours and `rgb()`, `hsl()` …: use `var(--text-primary)`, `var(--glass-fill)` …
- raw values for colour, background, font-size, font-family, border-radius, box-shadow, gap, padding, margin and transition and animation durations: use `var(--gap-md)`, `var(--radius-lg)`, `var(--shadow-glass-regular)`, `var(--duration-fast)` …

Allowed without tokens: `0`, `auto`, `inherit`, `initial`, `unset`, `none`, `transparent`, `currentColor`.

## Updating from the design system

1. Copy the design system's `project/tokens.json` over `src/styles/factman/tokens.json`, and `project/components/bundle.css` over `src/styles/factman/bundle.css`.
2. Run `pnpm ds:tokens` and `pnpm ds:split`.
3. `pnpm test:scripts` fails if the generated files drift from their sources, or if the split loses a line.

Fonts (Plus Jakarta Sans, Jost, JetBrains Mono) are self-hosted under ETE-23; until then the font stacks fall back to system fonts, and nothing is loaded from Google.
