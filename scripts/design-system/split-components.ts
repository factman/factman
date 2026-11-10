/**
 * `pnpm ds:split`: splits the design system's bundle.css into
 *   - src/styles/factman/global.css: what every page needs (.fm-backdrop, .fm-icon,
 *     shared tones, glass and arrows, and the .fm-reveal rules the fmReveal directive uses on any
 *     element), loaded globally in angular.json
 *   - src/styles/factman/components/<section>.css: one file per component section,
 *     NOT loaded globally. Each Angular component adds its section to its own styles,
 *     so a page only loads CSS for the components it renders (see docs/design-tokens.md).
 * Sections are the bundle's `/* ---------- Name ---------- *\/` and `/* ===== Name ===== *\/` headers.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BUNDLE = 'src/styles/factman/bundle.css';
export const GLOBAL = 'src/styles/factman/global.css';
export const COMPONENTS_DIR = 'src/styles/factman/components';
/** Sections that every page needs, merged into global.css after the preamble. */
const GLOBAL_SECTIONS = new Set(['shared-tones-glass-arrows']);
/**
 * Top-level rules lifted out of their section into global.css: helpers that are not tied to one
 * component. `.fm-reveal` is used by the fmReveal directive (ETE-26) on any element.
 */
const GLOBAL_RULES = [/^\.fm-reveal[\s.:{,]/];
const HEADER = /^\/\* (?:-{3,}|={3,}) (.+?) (?:-{3,}|={3,})?\s*\*\/\s*$/;
const BANNER = (what: string) =>
  `/* Factman ${what}, split from bundle.css by scripts/design-system/split-components.ts. Do not edit. */\n`;

export const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export interface SplitResult {
  global: string;
  sections: Map<string, string>;
}

export function splitBundle(css: string): SplitResult {
  const preamble: string[] = [];
  const sections = new Map<string, string[]>();
  let current: string[] = preamble;
  for (const line of css.split('\n')) {
    const m = HEADER.exec(line);
    if (m) {
      const name = slug(m[1]);
      if (sections.has(name)) throw new Error(`duplicate section "${name}" in bundle.css`);
      current = [line];
      sections.set(name, current);
    } else {
      current.push(line);
    }
  }
  const trim = (lines: string[]) => lines.join('\n').trim() + '\n';
  const globalParts = [trim(preamble)];
  const lifted: string[] = [];
  const out = new Map<string, string>();
  for (const [name, lines] of sections) {
    if (GLOBAL_SECTIONS.has(name)) {
      globalParts.push(trim(lines));
      continue;
    }
    const kept = lines.filter((line) => {
      const lift = GLOBAL_RULES.some((re) => re.test(line));
      if (lift) lifted.push(line);
      return !lift;
    });
    out.set(name, trim(kept));
  }
  if (lifted.length) globalParts.push(trim(lifted));
  return { global: globalParts.join('\n'), sections: out };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  const { global, sections } = splitBundle(readFileSync(join(root, BUNDLE), 'utf8'));
  const expected = new Map<string, string>([[GLOBAL, BANNER('global styles') + global]]);
  for (const [name, css] of sections)
    expected.set(`${COMPONENTS_DIR}/${name}.css`, BANNER(`"${name}" component styles`) + css);

  if (process.argv.includes('--check')) {
    const stale: string[] = [];
    for (const [file, css] of expected) {
      let current = '';
      try {
        current = readFileSync(join(root, file), 'utf8');
      } catch {
        /* missing */
      }
      if (current !== css) stale.push(file);
    }
    const existing = readdirSync(join(root, COMPONENTS_DIR)).map((f) => `${COMPONENTS_DIR}/${f}`);
    stale.push(...existing.filter((f) => !expected.has(f)));
    if (stale.length) {
      console.error(`ds:split is out of date (${stale.join(', ')}); run pnpm ds:split`);
      process.exit(1);
    }
    console.log('ds:split: up to date');
  } else {
    rmSync(join(root, COMPONENTS_DIR), { recursive: true, force: true });
    mkdirSync(join(root, COMPONENTS_DIR), { recursive: true });
    for (const [file, css] of expected) writeFileSync(join(root, file), css);
    console.log(`ds:split: ${GLOBAL} + ${sections.size} component files in ${COMPONENTS_DIR}`);
  }
}
