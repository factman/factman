/**
 * Cross-reference and content rules that JSON Schema alone can't express (PRD section 7).
 * Every rule is a pure function of the loaded data, so it is unit-tested without the file system.
 */
import { DATA_DIR } from './registry';
import type { Issue } from './issues';

type Json = null | boolean | number | string | Json[] | JsonObject;
interface JsonObject {
  [key: string]: Json;
}
export type DataSet = Partial<Record<string, Json>>;
export interface RuleContext {
  /** True when `relativePath` (relative to `src/assets`) exists. */
  assetExists: (relativePath: string) => boolean;
}

const file = (name: string) => `${DATA_DIR}/${name}.json`;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isObject = (v: Json | undefined): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : []);
const str = (v: Json | undefined): string | undefined => (typeof v === 'string' ? v : undefined);

/** Walks every value with its JSON Pointer. */
function* walk(value: Json, path = ''): Generator<[string, Json]> {
  yield [path, value];
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* walk(value[i], `${path}/${i}`);
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value))
      yield* walk(v, `${path}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`);
  }
}

/** `id` and `slug` are unique within each array file (and roles within experience); string ids and slugs are kebab-case. */
export function uniqueIds(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  const check = (name: string, items: Json[], base: string) => {
    for (const key of ['id', 'slug'] as const) {
      const seen = new Map<string | number, number>();
      items.forEach((item, i) => {
        if (!isObject(item)) return;
        const v = item[key];
        if (typeof v !== 'string' && typeof v !== 'number') return;
        if (typeof v === 'string' && !KEBAB.test(v)) {
          issues.push({
            file: file(name),
            path: `${base}/${i}/${key}`,
            message: `${key} "${v}" must be kebab-case`,
          });
        }
        if (seen.has(v)) {
          issues.push({
            file: file(name),
            path: `${base}/${i}/${key}`,
            message: `duplicate ${key} "${v}" (also at ${base}/${seen.get(v)})`,
          });
        } else seen.set(v, i);
      });
    }
  };
  for (const [name, value] of Object.entries(data)) {
    if (Array.isArray(value)) check(name, value, '');
  }
  const roles: Json[] = [];
  asArray(data['experience']).forEach((org) => {
    if (isObject(org)) roles.push(...asArray(org['roles']));
  });
  if (roles.length) check('experience', roles, '(roles)');
  return issues;
}

/** No plain `http://` URL anywhere; links must be https (or mailto:, tel:, relative). */
export function noInsecureLinks(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  for (const [name, value] of Object.entries(data)) {
    if (value === undefined) continue;
    for (const [path, v] of walk(value)) {
      if (typeof v === 'string' && /^http:\/\//i.test(v)) {
        issues.push({ file: file(name), path, message: `insecure link "${v}"; use https://` });
      }
    }
  }
  return issues;
}

/** `projects[].stack` and `experience roles[].skills` name skills that exist (by id or name) in skills.json. */
export function skillReferences(data: DataSet): Issue[] {
  const skills = asArray(data['skills']);
  if (!skills.length) return [];
  const known = new Set<string>();
  skills.forEach((s) => {
    if (!isObject(s)) return;
    const id = str(s['id']);
    const nm = str(s['name']);
    if (id) known.add(id);
    if (nm) known.add(nm);
  });
  const issues: Issue[] = [];
  asArray(data['projects']).forEach((p, i) => {
    if (!isObject(p)) return;
    asArray(p['stack']).forEach((s, j) => {
      if (typeof s === 'string' && !known.has(s)) {
        issues.push({
          file: file('projects'),
          path: `/${i}/stack/${j}`,
          message: `unknown skill "${s}" (not in skills.json)`,
        });
      }
    });
  });
  asArray(data['experience']).forEach((org, i) => {
    if (!isObject(org)) return;
    asArray(org['roles']).forEach((role, r) => {
      if (!isObject(role)) return;
      asArray(role['skills']).forEach((s, j) => {
        if (typeof s === 'string' && !known.has(s)) {
          issues.push({
            file: file('experience'),
            path: `/${i}/roles/${r}/skills/${j}`,
            message: `unknown skill "${s}" (not in skills.json)`,
          });
        }
      });
    });
  });
  return issues;
}

/** Every `tracks` value (skills, projects, roles, highlights) is a résumé id from resumes.json. */
export function trackReferences(data: DataSet): Issue[] {
  const resumes = asArray(data['resumes']);
  if (!resumes.length) return [];
  const ids = new Set(
    resumes.map((r) => (isObject(r) ? str(r['id']) : undefined)).filter((x): x is string => !!x),
  );
  const issues: Issue[] = [];
  for (const name of ['skills', 'projects', 'experience']) {
    const value = data[name];
    if (value === undefined) continue;
    for (const [path, v] of walk(value)) {
      if (!path.endsWith('/tracks') || !Array.isArray(v)) continue;
      v.forEach((t, j) => {
        if (typeof t === 'string' && !ids.has(t)) {
          issues.push({
            file: file(name),
            path: `${path}/${j}`,
            message: `unknown résumé track "${t}" (not an id in resumes.json)`,
          });
        }
      });
    }
  }
  return issues;
}

/** A private project never exposes a live or source link. */
export function privateProjects(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  asArray(data['projects']).forEach((p, i) => {
    if (!isObject(p) || p['visibility'] !== 'private' || !isObject(p['links'])) return;
    for (const key of ['live', 'source'] as const) {
      if (p['links'][key] !== undefined) {
        issues.push({
          file: file('projects'),
          path: `/${i}/links/${key}`,
          message: 'a private project must not link out (live or source)',
        });
      }
    }
  });
  return issues;
}

/** Image and file fields point at files that exist under src/assets. */
export const ASSET_KEYS = new Set(['logo', 'cover', 'gallery', 'src', 'image', 'ogImage']);
export function assetsExist(data: DataSet, ctx: RuleContext): Issue[] {
  const issues: Issue[] = [];
  const checkValue = (name: string, path: string, v: Json) => {
    if (typeof v !== 'string' || /^(https?:|mailto:|tel:|data:)/i.test(v)) return;
    const rel = v.replace(/^\/?(assets\/)?/, '');
    if (!ctx.assetExists(rel)) {
      issues.push({
        file: file(name),
        path,
        message: `missing asset "${v}" (expected src/assets/${rel})`,
      });
    }
  };
  for (const [name, value] of Object.entries(data)) {
    if (value === undefined) continue;
    for (const [path, v] of walk(value)) {
      const key = path.split('/').pop() ?? '';
      const parentKey = path.split('/').slice(-2, -1)[0] ?? '';
      if (ASSET_KEYS.has(key) && typeof v === 'string') checkValue(name, path, v);
      else if (parentKey === 'gallery' && /^\d+$/.test(key)) checkValue(name, path, v);
    }
  }
  return issues;
}

/** Date ranges are ordered: a role or project never ends before it starts. */
export function dateOrder(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  const cmp = (name: string, path: string, start: Json | undefined, end: Json | undefined) => {
    if (typeof start === 'string' && typeof end === 'string' && end < start) {
      issues.push({ file: file(name), path, message: `ends (${end}) before it starts (${start})` });
    }
  };
  asArray(data['experience']).forEach((org, i) => {
    if (!isObject(org)) return;
    asArray(org['roles']).forEach((role, r) => {
      if (isObject(role)) cmp('experience', `/${i}/roles/${r}`, role['start'], role['end']);
    });
  });
  asArray(data['projects']).forEach((p, i) => {
    if (isObject(p)) cmp('projects', `/${i}`, p['startedAt'], p['completedAt']);
  });
  return issues;
}

export const RULES = [
  uniqueIds,
  noInsecureLinks,
  skillReferences,
  trackReferences,
  privateProjects,
  assetsExist,
  dateOrder,
];

export function runRules(data: DataSet, ctx: RuleContext): Issue[] {
  return RULES.flatMap((rule) => rule(data, ctx));
}
