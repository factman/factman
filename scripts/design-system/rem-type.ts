/**
 * Type sizes in rem (ETE-263): px font sizes and line heights ignore the visitor's browser and OS
 * text size. This rewrites them to rem (px / 16) in `font-size`, `line-height` and the `font`
 * shorthand, leaving every other px (spacing, widths, borders) alone. At the default 16px root
 * the result renders exactly the same. `pnpm ds:split` applies it to the design system's CSS.
 */
export const ROOT_PX = 16;

/** `13px` → `0.8125rem`; `0px` → `0`. */
export const pxToRem = (px: number): string => {
  if (px === 0) return '0';
  const rem = Number((px / ROOT_PX).toFixed(5));
  return `${rem}rem`;
};

const PX = /(-?\d*\.?\d+)px\b/g;
const remify = (value: string) => value.replace(PX, (_, n: string) => pxToRem(Number(n)));

/** The CSS with px type sizes in rem. Declarations other than font, font-size, line-height are untouched. */
export function remType(css: string): string {
  return css.replace(
    /(^|[\s;{])(font-size|line-height|font)(\s*:\s*)([^;}]+)/g,
    (_, lead: string, prop: string, colon: string, value: string) =>
      `${lead}${prop}${colon}${remify(value)}`,
  );
}
