/**
 * `pnpm data:docs` (ETE-39): writes docs/data-reference.md, a field-by-field reference for every
 * data file, generated from src/data/schemas so it can never drift from the validation.
 * `pnpm data:docs --check` fails when the file is out of date (part of `pnpm test:scripts`).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

import { DATA_FILES, SCHEMA_DIR } from './registry';

export const REFERENCE_FILE = 'docs/data-reference.md';

interface Schema {
  $ref?: string;
  $defs?: Record<string, Schema>;
  title?: string;
  description?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  pattern?: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  oneOf?: Schema[];
}

interface Row {
  field: string;
  required: boolean;
  type: string;
  rules: string;
  description: string;
}

const code = (v: unknown) => `\`${typeof v === 'string' ? v : JSON.stringify(v)}\``;
const escape = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Follows a local `#/$defs/<name>` reference. */
function deref(schema: Schema, root: Schema): Schema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.replace('#/$defs/', '');
  const target = root.$defs?.[name];
  if (!target) throw new Error(`Unresolved ${schema.$ref}`);
  const rest: Schema = { ...schema };
  delete rest.$ref;
  return { ...deref(target, root), ...rest };
}

function typeOf(schema: Schema, root: Schema): string {
  const s = deref(schema, root);
  if (s.oneOf) return s.oneOf.map((o) => typeOf(o, root)).join(' or ');
  if (s.enum) return 'one of';
  if (s.const !== undefined) return 'fixed';
  if (s.type === 'array') return `list of ${typeOf(s.items ?? {}, root)}`;
  if (Array.isArray(s.type)) return s.type.join(' or ');
  if (s.type === 'object' || s.properties) return 'object';
  return s.type ?? 'any';
}

function rulesOf(schema: Schema, root: Schema): string {
  const s = deref(schema, root);
  const rules: string[] = [];
  if (s.enum) rules.push(s.enum.map(code).join(', '));
  if (s.const !== undefined) rules.push(code(s.const));
  if (s.format) rules.push(s.format);
  if (s.pattern) rules.push(`pattern ${code(s.pattern)}`);
  if (s.minLength !== undefined && s.minLength > 1)
    rules.push(`at least ${s.minLength} characters`);
  if (s.maxLength !== undefined) rules.push(`at most ${s.maxLength} characters`);
  if (s.minimum !== undefined) rules.push(`≥ ${s.minimum}`);
  if (s.exclusiveMinimum !== undefined) rules.push(`> ${s.exclusiveMinimum}`);
  if (s.maximum !== undefined) rules.push(`≤ ${s.maximum}`);
  if (s.minItems) rules.push(`at least ${s.minItems}`);
  if (s.maxItems !== undefined) rules.push(`at most ${s.maxItems}`);
  if (s.uniqueItems) rules.push('no repeats');
  if (s.type === 'array' && s.items) {
    const item = rulesOf(s.items, root);
    if (item) rules.push(`each: ${item}`);
  }
  return rules.join('; ');
}

/** One row per field, nested objects and lists of objects flattened as `a.b` and `a[].b`. */
function rows(schema: Schema, root: Schema, prefix = '', depth = 0): Row[] {
  const s = deref(schema, root);
  const props = s.properties ?? {};
  const required = new Set(s.required ?? []);
  return Object.entries(props).flatMap(([name, raw]) => {
    const prop = deref(raw, root);
    const field = `${prefix}${name}`;
    const row: Row = {
      field,
      required: required.has(name),
      type: typeOf(prop, root),
      rules: rulesOf(prop, root),
      description: prop.description ?? '',
    };
    const children =
      depth >= 3
        ? []
        : prop.properties
          ? rows(prop, root, `${field}.`, depth + 1)
          : prop.type === 'array' && prop.items && deref(prop.items, root).properties
            ? rows(prop.items, root, `${field}[].`, depth + 1)
            : [];
    return [row, ...children];
  });
}

function section(name: string, schema: Schema): string {
  const isList = schema.type === 'array';
  const top = isList ? deref(schema.items ?? {}, schema) : schema;
  const table = rows(top, schema).map(
    (r) =>
      `| \`${r.field}\` | ${r.required ? 'yes' : ''} | ${escape(r.type)} | ${escape(r.rules)} | ${escape(r.description)} |`,
  );
  return [
    `## \`${name}.json\``,
    '',
    escape(schema.description ?? ''),
    '',
    isList
      ? `A list of ${schema.title ? `${schema.title.replace(/s$/, '').toLowerCase()} records` : 'records'}${schema.minItems ? ` (at least ${schema.minItems})` : ''}. Each record:`
      : 'One object:',
    '',
    '| Field | Required | Type | Rules | Notes |',
    '| ----- | -------- | ---- | ----- | ----- |',
    ...table,
    '',
  ].join('\n');
}

/** The reference as it should be on disk (Prettier-formatted, like every Markdown file here). */
export async function renderReference(root: string): Promise<string> {
  return format(rawReference(root), { parser: 'markdown', filepath: REFERENCE_FILE });
}

function rawReference(root: string): string {
  const schemaDir = join(root, SCHEMA_DIR);
  const files = existsSync(schemaDir)
    ? readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json'))
    : [];
  const order = (n: string) => {
    const i = (DATA_FILES as readonly string[]).indexOf(n);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const names = files
    .map((f) => f.replace(/\.schema\.json$/, ''))
    .sort((a, b) => order(a) - order(b));
  return [
    '# Data field reference',
    '',
    '<!-- Generated by `pnpm data:docs` from src/data/schemas. Do not edit by hand. -->',
    '',
    'Every field of every data file in `src/data/`, generated from its JSON Schema. For how to make common changes, see [data-authoring.md](data-authoring.md).',
    '',
    names.map((n) => `- [\`${n}.json\`](#${n}json)`).join('\n'),
    '',
    ...names.map((n) =>
      section(n, JSON.parse(readFileSync(join(schemaDir, `${n}.schema.json`), 'utf8'))),
    ),
  ].join('\n');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = process.cwd();
  const file = join(root, REFERENCE_FILE);
  renderReference(root).then((next) => {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (process.argv.includes('--check')) {
      if (current !== next) {
        console.error(`data:docs: ${REFERENCE_FILE} is out of date; run pnpm data:docs`);
        process.exit(1);
      }
      console.log(`data:docs: ${REFERENCE_FILE} is up to date`);
    } else {
      writeFileSync(file, next);
      console.log(`data:docs: wrote ${REFERENCE_FILE}`);
    }
  });
}
