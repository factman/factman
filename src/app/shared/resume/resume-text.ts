/**
 * Text in résumé data can carry:
 * - `{years}`: whole years since `profile.careerStart` (the "13+" figure);
 * - `{since:<skill id>}`: that skill's start year from skills.json;
 * - `[placeholders]`: owner-supplied figures, filled from `resumes.json` `placeholders`.
 * Pure functions, shared by the résumé view model and `pnpm data:validate`.
 */

/** One run of text. A placeholder run also says whether the owner has supplied its value. */
export interface Segment {
  readonly text: string;
  readonly placeholder?: { readonly token: string; readonly filled: boolean };
}

/** Résumé text split into runs, so a template can highlight unfilled placeholders. */
export type RichText = readonly Segment[];

/** Matches one `[placeholder]` token: brackets around anything but brackets or a line break. */
export const PLACEHOLDER = /\[[^[\]\n]+\]/g;
/** Matches `{years}` and `{since:<skill id>}`. */
export const VARIABLE = /\{(years|since:[a-z0-9]+(?:-[a-z0-9]+)*)\}/g;

/** Every `[placeholder]` token in a string, in order (repeats included). */
export const placeholdersIn = (text: string): string[] => text.match(PLACEHOLDER) ?? [];

export interface TextContext {
  /** Whole years of experience, for `{years}`. */
  readonly years: number;
  /** Start year of a skill by id, for `{since:<id>}`; undefined when unknown. */
  readonly since: (skillId: string) => number | undefined;
  /** Placeholder values by token; `null` or missing means not supplied yet. */
  readonly values: ReadonlyMap<string, string | null>;
}

/** Fills `{years}` and `{since:…}`. Throws on an unknown skill, so bad data fails the build. */
export function fillVariables(text: string, ctx: TextContext): string {
  return text.replace(VARIABLE, (_, name: string) => {
    if (name === 'years') return String(ctx.years);
    const id = name.slice('since:'.length);
    const year = ctx.since(id);
    if (year === undefined) throw new Error(`{since:${id}}: skill "${id}" has no start year`);
    return String(year);
  });
}

/** Fills the variables, then splits out `[placeholders]`, replacing those that have a value. */
export function resolveText(text: string, ctx: TextContext): RichText {
  const filled = fillVariables(text, ctx);
  const segments: Segment[] = [];
  let last = 0;
  for (const match of filled.matchAll(PLACEHOLDER)) {
    const at = match.index ?? 0;
    if (at > last) segments.push({ text: filled.slice(last, at) });
    const token = match[0];
    const value = ctx.values.get(token);
    segments.push(
      value
        ? { text: value, placeholder: { token, filled: true } }
        : { text: token, placeholder: { token, filled: false } },
    );
    last = at + token.length;
  }
  if (last < filled.length) segments.push({ text: filled.slice(last) });
  return segments;
}

/** The plain text of a rich text. */
export const plainText = (text: RichText): string => text.map((s) => s.text).join('');

/** Tokens in a rich text that still have no value. */
export const unfilledIn = (text: RichText): string[] =>
  text.flatMap((s) => (s.placeholder && !s.placeholder.filled ? [s.placeholder.token] : []));
