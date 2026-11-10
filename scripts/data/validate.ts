/**
 * `pnpm data:validate`: checks every data file in src/data against its JSON Schema
 * (draft 2020-12, Ajv) and the cross-reference rules, then fails with one line per problem.
 * Runs before build and test, so bad data stops everything else.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import { readImageSize } from './image-size';
import { formatIssue, isError, type DsRule, type Issue } from './issues';
import { ASSETS_DIR, DATA_DIR, DATA_FILES, SCHEMA_DIR } from './registry';
import { runRules, type DataSet } from './rules';

export interface ValidationResult {
  issues: Issue[];
  /** Data files that were checked, by name. */
  checked: string[];
}

/**
 * The PRD case a schema error breaks: a missing field is DS-02 and a bad enum DS-03, unless the
 * file or field has its own case (site IDs DS-12, clients DS-16, contact DS-11, blog DS-13,
 * summary and excerpt length DS-10). Anything else (type, format, extra field) is DS-01.
 */
export function schemaRule(file: string, keyword: string, path: string): DsRule {
  if (keyword === 'required') return 'DS-02';
  if (file === 'site' && /^\/(analytics\/(gtmId|ga4Id)|consent\/version)$/.test(path))
    return 'DS-12';
  if (file === 'clients') return 'DS-16';
  if (file === 'contact') return 'DS-11';
  if (file === 'blog') return 'DS-13';
  if (keyword === 'maxLength' && /\/(summary|excerpt)$/.test(path)) return 'DS-10';
  if (keyword === 'enum' || keyword === 'const') return 'DS-03';
  return 'DS-01';
}

export function validateData(root: string): ValidationResult {
  const issues: Issue[] = [];
  const rel = (p: string) => relative(root, p).split('\\').join('/');
  const dataDir = join(root, DATA_DIR);
  const schemaDir = join(root, SCHEMA_DIR);
  const known = new Set<string>(DATA_FILES);

  const dataFiles = existsSync(dataDir)
    ? readdirSync(dataDir).filter((f) => f.endsWith('.json'))
    : [];
  const schemaFiles = existsSync(schemaDir)
    ? readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json'))
    : [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);

  const data: DataSet = {};
  const checked: string[] = [];

  for (const f of schemaFiles) {
    const name = f.replace(/\.schema\.json$/, '');
    if (!dataFiles.includes(`${name}.json`)) {
      issues.push({
        file: rel(join(schemaDir, f)),
        path: '',
        message: `schema has no data file (expected ${DATA_DIR}/${name}.json)`,
        rule: 'DS-01',
      });
    }
  }

  for (const f of dataFiles) {
    const name = f.replace(/\.json$/, '');
    const dataPath = join(dataDir, f);
    const schemaPath = join(schemaDir, `${name}.schema.json`);
    if (!known.has(name)) {
      issues.push({
        file: rel(dataPath),
        path: '',
        message: `unknown data file; expected one of ${DATA_FILES.join(', ')}`,
        rule: 'DS-01',
      });
      continue;
    }
    if (!existsSync(schemaPath)) {
      issues.push({
        file: rel(dataPath),
        path: '',
        message: `no schema (expected ${SCHEMA_DIR}/${name}.schema.json)`,
        rule: 'DS-01',
      });
      continue;
    }

    let value: unknown;
    let schema: { title?: unknown } & Record<string, unknown>;
    try {
      value = JSON.parse(readFileSync(dataPath, 'utf8'));
    } catch (e) {
      issues.push({
        file: rel(dataPath),
        path: '',
        message: `invalid JSON: ${(e as Error).message}`,
        rule: 'DS-01',
      });
      continue;
    }
    try {
      schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    } catch (e) {
      issues.push({
        file: rel(schemaPath),
        path: '',
        message: `invalid JSON: ${(e as Error).message}`,
      });
      continue;
    }
    if (typeof schema.title !== 'string' || !schema.title) {
      issues.push({
        file: rel(schemaPath),
        path: '',
        message: 'schema needs a "title" (it names the generated TypeScript type)',
      });
    }

    let validate;
    try {
      validate = ajv.compile(schema);
    } catch (e) {
      issues.push({
        file: rel(schemaPath),
        path: '',
        message: `invalid schema: ${(e as Error).message}`,
      });
      continue;
    }
    checked.push(name);
    if (!validate(value)) {
      for (const err of validate.errors ?? []) {
        const extra =
          err.keyword === 'additionalProperties'
            ? ` "${(err.params as { additionalProperty: string }).additionalProperty}"`
            : '';
        issues.push({
          file: rel(dataPath),
          path: err.instancePath,
          message: `${err.message ?? err.keyword}${extra}`,
          rule: schemaRule(name, err.keyword, err.instancePath),
        });
      }
    }
    data[name] = value as DataSet[string];
  }

  const assetsDir = join(root, ASSETS_DIR);
  issues.push(
    ...runRules(data, {
      assetExists: (p) => existsSync(join(assetsDir, p)),
      imageSize: (p) => readImageSize(join(assetsDir, p)),
    }),
  );
  return { issues, checked };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { issues, checked } = validateData(process.cwd());
  const line = (issue: Issue) => `  ${issue.rule ? `[${issue.rule}] ` : ''}${formatIssue(issue)}`;
  const errors = issues.filter(isError);
  const warnings = issues.filter((i) => !isError(i));
  for (const warning of warnings) console.warn(`warning:${line(warning)}`);
  if (errors.length) {
    console.error(`data:validate found ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
    for (const issue of errors) console.error(line(issue));
    process.exit(1);
  }
  console.log(
    `data:validate: ${checked.length} file${checked.length === 1 ? '' : 's'} valid${checked.length ? ` (${checked.join(', ')})` : ' (none seeded yet)'}`,
  );
}
