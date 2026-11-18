/** One icon of the design system's set (generated into `icons.ts` by `pnpm ds:icons`). */
export interface IconDef {
  /** Kebab-case name, as the design system and the data files use it (`arrow-right`). */
  readonly name: string;
  /** SVG path data on a 24 × 24 grid. */
  readonly d: string;
  /** Stroke width of an outline icon. */
  readonly stroke?: number;
  /** A filled mark (brand logos) instead of an outline. */
  readonly fill?: boolean;
}
