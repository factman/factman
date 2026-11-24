# Interaction and motion

How things move and respond on the site, for the developers building the [component inventory](component-inventory.md). It turns the approved [design canvas](https://claude.ai/artifact/DsfngJqGZQtNLwAymbRh5F) (its `site.css` and component boards) and the Factman design system into rules. Token values come from [design-tokens.md](design-tokens.md); every token named here is checked to exist by `pnpm test:scripts`.

## Rules that apply everywhere

1. **Durations and curves are tokens.** No raw `ms` or `cubic-bezier()` in our styles (stylelint enforces it).
2. **Only `opacity` and `transform` animate** in our own styles (stylelint enforces it, ETE-26). Colour, background, border, shadow and filter changes on hover are instant. The vendored design-system CSS under `src/styles/factman/` keeps its own transitions.
3. **Nothing important waits for motion.** The prerendered HTML shows every element in its final state: text, counters at their final value, the first typed role. Motion is added in the browser only.
4. **Reduced motion is a first-class state, not a fallback.** When `prefers-reduced-motion: reduce` matches, the global rule in `src/styles.scss` finishes every animation and transition at once and turns off smooth scrolling. Components also check `prefersReducedMotion()` from `@shared` and skip the work (see the table below).
5. **Every infinite animation sets `animation: none` under reduced motion.** The global rule runs an animation once at near-zero length, which leaves it on its last keyframe; for a loop that is usually the wrong frame (the marquee would sit half-scrolled, the caret would be invisible).

## Tokens

| Token                | Value                               | Use                                                        |
| -------------------- | ----------------------------------- | ---------------------------------------------------------- |
| `--duration-instant` | 100ms                               | Colour-only feedback in the design system                  |
| `--duration-fast`    | 150ms                               | Hover nudges and lifts, chevrons, arrow nudges             |
| `--duration-base`    | 200ms                               | Overlay fade, toast, mobile menu, route change fade        |
| `--duration-slow`    | 300ms                               | Modal panel, consent banner                                |
| `--duration-reveal`  | 600ms                               | Reveal on scroll; the marquee's base unit                  |
| `--duration-typing`  | 35ms                                | Typing unit (roles type at 2×)                             |
| `--duration-count`   | 1400ms                              | Count-up, footer heartbeat cycle                           |
| `--duration-blink`   | 1060ms                              | Caret blink cycle                                          |
| `--ease-out`         | `cubic-bezier(0.16, 1, 0.3, 1)`     | Default for anything entering or responding to the pointer |
| `--ease-in`          | `cubic-bezier(0.7, 0, 0.84, 0)`     | Anything leaving (rarely used: exits are instant)          |
| `--ease-in-out`      | `cubic-bezier(0.65, 0, 0.35, 1)`    | Loops that go and come back (heartbeat)                    |
| `--ease-spring`      | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Not used on the site; reserved for playful details         |

## Patterns

### Reveal on scroll

- **Where:** section headers, cards and media inside sections (`[fmReveal]` from `@shared`, built in ETE-26).
- **Motion:** fades in and rises 16px, `--duration-reveal`, `--ease-out`, once.
- **Stagger:** items revealed together use `fmRevealDelay` in steps of 60–80ms (0, 70, 140 for three cards; 60, 120, 160 for a hero's columns). Never more than about 300ms in total.
- **Trigger:** only elements that start below the fold are hidden and revealed; anything visible at load is never hidden.
- **Reduced motion:** nothing is hidden or animated.

### Typing roles (hero)

- **Where:** `Typewriter` in `ProfileHero` (`> ` prefix, bar caret), with the roles from `profile.json`.
- **Motion:** as the design system's `Typewriter`: types each role at 70ms per character (2 × `--duration-typing`), holds it for 1.6 s, erases at 30ms per character, waits 300ms, then types the next. Loops.
- **Caret:** `Caret` blinks with `--duration-blink` (`step-end`).
- **Accessibility:** the element exposes the full list once to assistive tech (visually hidden text) and hides the animated text with `aria-hidden`, so screen readers don't hear every keystroke.
- **Server render and reduced motion:** the first role, in full, with a steady caret. No typing, no loop.

### Count-up

- **Where:** `StatCounter` (hero stats, `StatsPanel` counters, `CareerGlance` numbers).
- **Motion:** counts from 0 to the value over `--duration-count`, easing out (`1 − (1 − t)⁴`, as in the design system's `StatCounter`), once, when the counter first scrolls into view.
- **Accessibility:** the final value is in the accessible name from the start; the moving digits are `aria-hidden`. Digits use tabular figures so the width never jumps.
- **Server render and reduced motion:** the final value, no counting.

### Logo marquee ("Worked with")

- **Where:** `ClientLogoStrip`.
- **Motion:** one endless right-to-left loop of two copies of the logo group (`translateX(0)` to `-50%`), linear. Length: `--duration-reveal` × 80 (48 s) at 768px and up, × 60 (36 s) below.
- **Edges:** a gradient mask fades the strip out over the outer 8% on each side.
- **Control:** pauses on hover, while anything inside has focus, and with its pause button (WCAG 2.2.2: hover alone leaves touch and keyboard users without a way to stop it).
- **Copies:** a short list repeats until a group has at least 16 logos, so the loop never shows a gap; the second group makes it seamless. The repeats and the second group are `aria-hidden` and `inert`, so each client is announced and focused once.
- **Reduced motion:** no animation, no mask and no pause button; the copies are removed and the logos wrap and centre as a static grid.

### Modals (résumé preview, scheduler)

- **Where:** `Dialog`, used by `ResumePreviewModal` and `SchedulerModal`.
- **Open:** the backdrop fades in (`--duration-base`, `--ease-out`); the panel fades in and scales from 0.98 (`--duration-slow`, `--ease-out`).
- **Close:** instant. No exit animation.
- **Behaviour:**
  - `role="dialog"` with `aria-modal="true"` and a label.
  - Focus moves into the dialog (to its close button) on open, is trapped inside while open and returns to the control that opened it on close.
  - Escape, the close button and a click on the backdrop all close it.
  - The page behind does not scroll and is `inert`.
- **Below 768px:** the panel fills the screen (no margin, no radius, full height).
- **Reduced motion:** opens and closes instantly; behaviour unchanged.

### Other entrances

| Element                          | Motion                                           | Duration and curve                  |
| -------------------------------- | ------------------------------------------------ | ----------------------------------- |
| Mobile menu                      | Fades in and drops 8px                           | `--duration-base`, `--ease-out`     |
| Cookie consent banner            | Fades in and rises 16px                          | `--duration-slow`, `--ease-out`     |
| Toast                            | Fades in and rises 16px; auto-closes after 3.2 s | `--duration-base`, `--ease-out`     |
| Route change                     | The new page's main content fades in             | `--duration-base`, `--ease-out`     |
| Menus, selects, popovers         | Fade in (design-system CSS)                      | 200ms, ease-out                     |
| Availability dot                 | Pulsing ring, endless                            | 2 s, `--ease-out`                   |
| Footer heart (`TerminalSignOff`) | Heartbeat, endless                               | `--duration-count`, `--ease-in-out` |
| Spinner                          | Rotates, endless                                 | 0.8 s, linear                       |
| Skeleton                         | Shimmer, endless                                 | 1.4 s, linear                       |

All of these are instant (or static) under reduced motion. Endless ones stop: the dot and heart sit still, the skeleton is flat, the spinner stands still and its label still says "Loading".

### Smooth scrolling

In-page anchors (`#about`, `#contact` …) scroll smoothly; targets clear the sticky navbar with `scroll-margin-top: var(--navbar-height)`. Reduced motion jumps instead.

How it works (FR-37, ETE-87):

- **Scrolling:** `AnchorScroller` replaces the router's `ViewportScroller`. It scrolls anchors with `scrollIntoView`, so `scroll-margin-top` applies; Angular's own scroller ignores it. A new page and back or forward stay instant, as the router asks. There is no global `scroll-behavior: smooth`, which would animate those too.
- **Deep links:** a link opened from outside (`/#contact`) jumps straight to its section once the page has rendered. The router doesn't scroll while a prerendered page hydrates.
- **Scroll-spy:** behind the `features.scrollSpy` flag (P1, off in v1.0), the header marks the section in view (`aria-current="location"`). The URL hash follows it with `replaceState`: no jump, no history entry. Scrolling above the first section clears the hash.

## Reduced motion, per component

| Component                                                                            | Normally                       | With reduced motion                     |
| ------------------------------------------------------------------------------------ | ------------------------------ | --------------------------------------- |
| `[fmReveal]`                                                                         | Fades and rises in             | Shown at once, never hidden             |
| `Typewriter`, `Caret`                                                                | Types and erases roles; blinks | First role in full; steady caret        |
| `StatCounter`                                                                        | Counts up                      | Final value                             |
| `ClientLogoStrip`                                                                    | Endless marquee                | Static, wrapped, centred grid; no clone |
| `Dialog`                                                                             | Fades and scales in            | Appears at once                         |
| Mobile menu, consent banner, toast                                                   | Fade and slide in              | Appear at once                          |
| Hover lifts and nudges                                                               | 2–3px movement                 | No movement; colour changes only        |
| `AvailabilityBadge`, `StatusDot` (`pulse`), `TerminalSignOff`, `Skeleton`, `Spinner` | Endless loops                  | No loop                                 |
| Anchor links                                                                         | Smooth scroll                  | Jump                                    |

Unit tests cover both states for each component that checks `prefersReducedMotion()` (stub `matchMedia`).

## Hover, focus and pressed

Shared by every interactive component. The design-system classes already implement most of this; components must not override it.

**Focus**

- Only `:focus-visible` shows a ring, never plain `:focus`. Never remove an outline without the ring replacing it.
- Ring: `outline: var(--border-width-lg) solid var(--border-focus)` with `outline-offset: 2px` (1px inside the navbar).
- Keyboard focus always gets the same treatment as hover: `:hover` rules are written as `:hover, :focus-visible` (or `:focus-within` for cards).
- A skip link ("Skip to content") is the first focusable element and appears on focus.

**Hover** (pointer only; touch screens get no hover effects, and nothing depends on them)

| Element                                     | Hover                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Buttons                                     | Background and border from the `-hover` tokens (design-system CSS). No movement.                                                   |
| Clickable cards (project, service, channel) | Lift 2px (`translateY(-2px)`, `--duration-fast`, `--ease-out`); the card's arrow nudges 3px right.                                 |
| Client logos                                | Greyscale and 80% opacity at rest; full colour and opacity on hover or focus. The opacity animates; the filter switches instantly. |
| Text links                                  | Colour changes to `--text-primary`; no underline animation.                                                                        |

**Pressed**

- `:active`, plus `.is-pressed` for toggles that stay on (chips, the active résumé tab).
- Background from the pressed token, plus `--shadow-button-pressed-light` (light buttons) or `--shadow-button-pressed-dark` (primary). No scaling.
- Toggles set `aria-pressed`; tabs set `aria-selected`.

**Disabled**

- No hover or pressed state; `cursor: not-allowed`.
- Controls use `--opacity-disabled-control` and fields use `--opacity-disabled-field`.
- Use `aria-disabled` when the control must stay focusable to explain why it is disabled.

**Whole-card links**

The card's title link is stretched over the card (`.card-link`). Other buttons inside the card sit above it (`.card-above`), so there are never nested interactive elements.

**Touch targets**

At least 24 × 24px everywhere (WCAG 2.2 AA). Primary actions on phones are at least 44px tall (`lg` buttons are 48px).

## Breakpoints and grids

Breakpoint tokens: `--breakpoint-mobile` 390px (the design width for phones), `--breakpoint-tablet` 768px, `--breakpoint-laptop` 1280px, `--breakpoint-desktop` 1440px. The canvas also switches layouts at 1024px, which has no token. Media queries can't read CSS variables, so write the numbers from this table in media queries (`max-width: 767px`, `max-width: 1023px`, `max-width: 1279px`, `max-width: 1439px`), as the canvas does.

| Range         | Design width | Container padding | Section padding (block) | Grids                                                         | Navigation                     |
| ------------- | ------------ | ----------------- | ----------------------- | ------------------------------------------------------------- | ------------------------------ |
| < 768px       | 390          | 16px              | 40px (`--gap-4xl`)      | Every grid is one column                                      | Menu button and dropdown panel |
| 768 – 1023px  | 768          | 32px              | 64px (`--gap-5xl`)      | 2 columns; splits stack to one column                         | Menu button and dropdown panel |
| 1024 – 1279px | —            | 64px              | 96px                    | `grid-3`: 3 columns; `grid-4`: 2 columns; splits side by side | Full navbar                    |
| 1280 – 1439px | 1280         | 64px              | 96px                    | Full column counts                                            | Full navbar                    |
| ≥ 1440px      | 1440         | 80px              | 96px                    | Full column counts                                            | Full navbar                    |

- **Container:** content is at most `--content-max` (1200px) wide and centred.
- **Grids:** `grid-2`, `grid-3` and `grid-4` use equal `minmax(0, 1fr)` columns with a `--gap-xl` (24px) gap.
- **Splits:**
  - `split` is two equal columns with a `--gap-5xl` gap.
  - `split--wide` is 7 : 5 and `split--aside` is 8 : 4.
  - All splits stack below 1024px, with a `--gap-4xl` gap.
- **Sticky side cards:** booking and engage cards stick below the navbar from 1024px up and are static below.
- **Hero:** text and media side by side from 1024px up. Below that the photo moves above the text and shrinks to at most 300px wide on phones; the title steps down from 64px to 56px (below 1280px) and 40px (below 768px).
- **Very small phones (< 390px):** stats in `CareerGlance` drop to two columns; nothing else changes.
- **No horizontal scroll** at any width from 320px up; wide content (code, tables) scrolls inside its own panel.

Playwright checks layouts at 390, 768 and 1440 (ETE-84 visual baselines, ETE-117 integration tests).
