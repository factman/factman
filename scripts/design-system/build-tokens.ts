/**
 * `pnpm ds:tokens`: turns the Factman Design System's tokens.json into tokens.css.
 * Light values go on :root, Dark overrides on [data-theme="dark"] (only tokens whose
 * Dark value differs). `{name}` references become var(--name).
 * Source: src/styles/factman/tokens.json (copied from the design system artifact).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Themed = string | { light: string; dark: string };
interface Token {
  name: string;
  value: Themed;
}
interface TokenGroup {
  tokens: Token[];
}
interface Tokens {
  name: string;
  color: TokenGroup;
  type: { families: Record<string, string> };
  [group: string]: unknown;
}

export const SOURCE = 'src/styles/factman/tokens.json';
export const OUTPUT = 'src/styles/factman/tokens.css';
/** Groups emitted after colours, in the design system's order; shadows carry Dark values too. */
const GROUPS = [
  'spacing',
  'radius',
  'borderWidth',
  'shadow',
  'blur',
  'opacity',
  'layout',
  'duration',
  'easing',
];

const ref = (v: string) => v.replace(/\{([a-z0-9-]+)\}/g, 'var(--$1)');

export function buildTokensCss(tokens: Tokens): string {
  const root: string[] = [];
  const dark: string[] = [];
  const add = (t: Token) => {
    if (typeof t.value === 'string') {
      root.push(`  --${t.name}: ${ref(t.value)};`);
    } else {
      root.push(`  --${t.name}: ${ref(t.value.light)};`);
      if (t.value.dark !== t.value.light) dark.push(`  --${t.name}: ${ref(t.value.dark)};`);
    }
  };
  tokens.color.tokens.forEach(add);
  for (const g of GROUPS) {
    const group = tokens[g] as TokenGroup | undefined;
    group?.tokens.forEach(add);
  }
  for (const [family, stack] of Object.entries(tokens.type.families))
    root.push(`  --font-${family}: ${stack};`);
  return [
    `/* ${tokens.name} — generated from tokens.json by scripts/design-system/build-tokens.ts. Do not edit. */`,
    ':root {',
    ...root,
    '  color-scheme: light;',
    '}',
    '[data-theme="dark"] {',
    ...dark,
    '  color-scheme: dark;',
    '}',
    '',
  ].join('\n');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  const css = buildTokensCss(JSON.parse(readFileSync(join(root, SOURCE), 'utf8')) as Tokens);
  if (process.argv.includes('--check')) {
    const current = readFileSync(join(root, OUTPUT), 'utf8');
    if (current !== css) {
      console.error(`${OUTPUT} is out of date with ${SOURCE}; run pnpm ds:tokens`);
      process.exit(1);
    }
    console.log(`ds:tokens: ${OUTPUT} is up to date`);
  } else {
    writeFileSync(join(root, OUTPUT), css);
    console.log(`ds:tokens: wrote ${OUTPUT}`);
  }
}
