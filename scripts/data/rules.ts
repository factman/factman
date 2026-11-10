/**
 * Cross-reference and content rules that JSON Schema alone can't express (PRD section 7),
 * tagged with the PRD section 12 case they enforce (DS-04 to DS-17).
 * Every rule is a pure function of the loaded data, so it is unit-tested without the file system.
 */
import type { ImageSize } from './image-size';
import type { DsRule, Issue } from './issues';
import { DATA_DIR } from './registry';

type Json = null | boolean | number | string | Json[] | JsonObject;
interface JsonObject {
  [key: string]: Json;
}
export type DataSet = Partial<Record<string, Json>>;
export interface RuleContext {
  /** True when `relativePath` (relative to `src/assets`) exists. */
  assetExists: (relativePath: string) => boolean;
  /** Pixel size of an image under `src/assets`, or undefined when it can't be read. */
  imageSize?: (relativePath: string) => ImageSize | undefined;
}

const file = (name: string) => `${DATA_DIR}/${name}.json`;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** `2021-08` or `2021-08-15`: the date format for roles and projects (DS-06). */
const DATE = /^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/;
const OPEN_END = '9999-12';
const isObject = (v: Json | undefined): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : []);
const str = (v: Json | undefined): string | undefined => (typeof v === 'string' ? v : undefined);
const toAssetPath = (v: string) => v.replace(/^\/?(assets\/)?/, '');

/** Some files have a more specific case than the generic rule (blog DS-13, clients DS-16). */
const FILE_RULE: Partial<Record<string, DsRule>> = { blog: 'DS-13', clients: 'DS-16' };
const ruleFor = (name: string, fallback: DsRule): DsRule => FILE_RULE[name] ?? fallback;

/** blog.json may be a list of posts or `{ posts: [...] }`; the schema (ETE-32) decides. */
const blogPosts = (data: DataSet): Json[] => {
  const blog = data['blog'];
  return Array.isArray(blog) ? blog : isObject(blog) ? asArray(blog['posts']) : [];
};
const blogBase = (data: DataSet) => (Array.isArray(data['blog']) ? '' : '/posts');

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

/** DS-04: `id` and `slug` are unique within each array file (and roles within experience); string ids and slugs are kebab-case. */
export function uniqueIds(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  const check = (name: string, items: Json[], base: string) => {
    const rule = ruleFor(name, 'DS-04');
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
            rule,
          });
        }
        if (seen.has(v)) {
          issues.push({
            file: file(name),
            path: `${base}/${i}/${key}`,
            message: `duplicate ${key} "${v}" (also at ${base}/${seen.get(v)})`,
            rule,
          });
        } else seen.set(v, i);
      });
    }
  };
  for (const [name, value] of Object.entries(data)) {
    if (Array.isArray(value)) check(name, value, '');
  }
  if (isObject(data['blog'])) check('blog', blogPosts(data), '/posts');
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
        issues.push({
          file: file(name),
          path,
          message: `insecure link "${v}"; use https://`,
          rule: ruleFor(name, 'DS-01'),
        });
      }
    }
  }
  return issues;
}

/** DS-05: `projects[].stack` and `experience roles[].skills` name skills that exist (by id or name) in skills.json. */
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
          rule: 'DS-05',
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
            rule: 'DS-05',
          });
        }
      });
    });
  });
  return issues;
}

/** Every `tracks` value (skills, projects, roles, highlights) is a résumé id from resumes.json (a DS-05 cross-reference). */
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
            rule: 'DS-05',
          });
        }
      });
    }
  }
  return issues;
}

/** DS-07: a private project never exposes a live or source link. */
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
          rule: 'DS-07',
        });
      }
    }
  });
  return issues;
}

/** DS-07 (warning): a public project with no live or source link has nothing for visitors to open. */
export function publicProjectLinks(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  asArray(data['projects']).forEach((p, i) => {
    if (!isObject(p) || p['visibility'] !== 'public') return;
    const links = isObject(p['links']) ? p['links'] : {};
    if (links['live'] === undefined && links['source'] === undefined) {
      issues.push({
        file: file('projects'),
        path: `/${i}`,
        message: 'a public project has no live or source link',
        rule: 'DS-07',
        level: 'warning',
      });
    }
  });
  return issues;
}

/** DS-08: at most 6 featured projects (the home grid). */
export const MAX_FEATURED = 6;
export function featuredProjects(data: DataSet): Issue[] {
  const featured = asArray(data['projects']).filter((p) => isObject(p) && p['featured'] === true);
  return featured.length > MAX_FEATURED
    ? [
        {
          file: file('projects'),
          path: '',
          message: `${featured.length} featured projects; at most ${MAX_FEATURED}`,
          rule: 'DS-08',
        },
      ]
    : [];
}

/** DS-09: image and file fields point at files that exist under src/assets. Client logos are DS-16, the profile photo DS-17. */
export const ASSET_KEYS = new Set(['logo', 'cover', 'gallery', 'src', 'image', 'ogImage']);
export function assetsExist(data: DataSet, ctx: RuleContext): Issue[] {
  const issues: Issue[] = [];
  const checkValue = (name: string, path: string, v: Json) => {
    if (typeof v !== 'string' || /^(https?:|mailto:|tel:|data:)/i.test(v)) return;
    const rel = toAssetPath(v);
    if (!ctx.assetExists(rel)) {
      issues.push({
        file: file(name),
        path,
        message: `missing asset "${v}" (expected src/assets/${rel})`,
        rule: name === 'profile' && path === '/photo/src' ? 'DS-17' : ruleFor(name, 'DS-09'),
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

/** The dated records: experience roles and projects, with their start and end fields. */
function* periods(data: DataSet): Generator<{
  name: string;
  path: string;
  fields: [string, string];
  start: Json | undefined;
  end: Json | undefined;
}> {
  for (const [i, org] of asArray(data['experience']).entries()) {
    if (!isObject(org)) continue;
    for (const [r, role] of asArray(org['roles']).entries()) {
      if (isObject(role))
        yield {
          name: 'experience',
          path: `/${i}/roles/${r}`,
          fields: ['start', 'end'],
          start: role['start'],
          end: role['end'],
        };
    }
  }
  for (const [i, p] of asArray(data['projects']).entries()) {
    if (isObject(p))
      yield {
        name: 'projects',
        path: `/${i}`,
        fields: ['startedAt', 'completedAt'],
        start: p['startedAt'],
        end: p['completedAt'],
      };
  }
}

/** DS-06: role and project dates are `YYYY-MM` or `YYYY-MM-DD`. */
export function dateFormat(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  for (const { name, path, fields, start, end } of periods(data)) {
    [start, end].forEach((v, k) => {
      if (typeof v === 'string' && !DATE.test(v)) {
        issues.push({
          file: file(name),
          path: `${path}/${fields[k]}`,
          message: `date "${v}" must be YYYY-MM or YYYY-MM-DD`,
          rule: 'DS-06',
        });
      }
    });
  }
  return issues;
}

/** DS-06: date ranges are ordered: a role or project never ends before it starts. */
export function dateOrder(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  for (const { name, path, start, end } of periods(data)) {
    if (typeof start !== 'string' || typeof end !== 'string') continue;
    if (!DATE.test(start) || !DATE.test(end)) continue;
    if (end < start) {
      issues.push({
        file: file(name),
        path,
        message: `ends (${end}) before it starts (${start})`,
        rule: 'DS-06',
      });
    }
  }
  return issues;
}

/**
 * DS-06: two roles in the same organization don't overlap. Months are compared, and a role may
 * start in the month the previous one ended (a promotion), so only a shared span of two or more
 * months counts. A role with no end runs to the present.
 */
export function roleOverlap(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  const month = (v: Json | undefined) =>
    typeof v === 'string' && DATE.test(v) ? v.slice(0, 7) : undefined;
  asArray(data['experience']).forEach((org, i) => {
    if (!isObject(org)) return;
    const roles = asArray(org['roles'])
      .map((role, r) =>
        isObject(role) ? { r, start: month(role['start']), end: role['end'] } : undefined,
      )
      .filter((x) => x?.start)
      .map((x) => ({ ...x!, start: x!.start!, end: month(x!.end) ?? OPEN_END }));
    for (let a = 0; a < roles.length; a++) {
      for (let b = a + 1; b < roles.length; b++) {
        const [x, y] = [roles[a], roles[b]];
        if (x.start < y.end && y.start < x.end) {
          issues.push({
            file: file('experience'),
            path: `/${i}/roles/${y.r}`,
            message: `overlaps /${i}/roles/${x.r} in the same organization`,
            rule: 'DS-06',
          });
        }
      }
    }
  });
  return issues;
}

/** DS-10: `summary` at most 200 characters and `excerpt` at most 280, in any file. */
export const TEXT_LIMITS: Record<string, number> = { summary: 200, excerpt: 280 };
export function textLengths(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  for (const [name, value] of Object.entries(data)) {
    if (value === undefined) continue;
    for (const [path, v] of walk(value)) {
      const key = path.split('/').pop() ?? '';
      const limit = TEXT_LIMITS[key];
      if (limit && typeof v === 'string' && v.length > limit) {
        issues.push({
          file: file(name),
          path,
          message: `${key} is ${v.length} characters; at most ${limit}`,
          rule: 'DS-10',
        });
      }
    }
  }
  return issues;
}

/** DS-11: contact.json email is an address, phone is E.164 (`+234…`), WhatsApp (or `whatsapp.number`) is digits only. */
const CONTACT_FORMATS: Record<string, { pattern: RegExp; strip: RegExp; expected: string }> = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    strip: /^mailto:/i,
    expected: 'an email address',
  },
  phone: {
    pattern: /^\+[1-9]\d{6,14}$/,
    strip: /^tel:/i,
    expected: 'an E.164 number, e.g. +2348012345678',
  },
  whatsapp: { pattern: /^\d{7,15}$/, strip: /^$/, expected: 'digits only, e.g. 2348012345678' },
};
export function contactFormats(data: DataSet): Issue[] {
  const contact = data['contact'];
  if (contact === undefined) return [];
  const issues: Issue[] = [];
  for (const [path, v] of walk(contact)) {
    // whatsapp is a number string, or { number, message } as in contact.json (ETE-33).
    const key = path.endsWith('/whatsapp/number') ? 'whatsapp' : (path.split('/').pop() ?? '');
    const format = CONTACT_FORMATS[key.toLowerCase()];
    if (!format || typeof v !== 'string') continue;
    if (!format.pattern.test(v.replace(format.strip, ''))) {
      issues.push({
        file: file('contact'),
        path,
        message: `"${v}" must be ${format.expected}`,
        rule: 'DS-11',
      });
    }
  }
  return issues;
}

/** DS-12: site.json tag IDs have the right shape (or are null) and the consent version is an integer. */
const SITE_IDS = { gtmId: /^GTM-[A-Z0-9]+$/, ga4Id: /^G-[A-Z0-9]+$/ } as const;
export function siteSettings(data: DataSet): Issue[] {
  const site = data['site'];
  if (!isObject(site)) return [];
  const issues: Issue[] = [];
  const analytics = isObject(site['analytics']) ? site['analytics'] : {};
  for (const [key, pattern] of Object.entries(SITE_IDS)) {
    const v = analytics[key];
    if (v !== undefined && v !== null && !(typeof v === 'string' && pattern.test(v))) {
      issues.push({
        file: file('site'),
        path: `/analytics/${key}`,
        message: `${key} "${v}" must match ${pattern.source}`,
        rule: 'DS-12',
      });
    }
  }
  const consent = isObject(site['consent']) ? site['consent'] : {};
  if (consent['version'] !== undefined && !Number.isInteger(consent['version'])) {
    issues.push({
      file: file('site'),
      path: '/consent/version',
      message: 'consent version must be an integer',
      rule: 'DS-12',
    });
  }
  return issues;
}

/** DS-13: blog posts link over https, have a real `publishedAt` date and come from `manual` or `rss`. */
export function blogFields(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  const base = blogBase(data);
  blogPosts(data).forEach((post, i) => {
    if (!isObject(post)) return;
    const push = (key: string, message: string) =>
      issues.push({ file: file('blog'), path: `${base}/${i}/${key}`, message, rule: 'DS-13' });
    const url = post['url'];
    if (typeof url === 'string' && !url.startsWith('https://') && !/^http:\/\//i.test(url))
      push('url', `url "${url}" must start with https://`);
    const at = post['publishedAt'];
    if (
      at !== undefined &&
      (typeof at !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(at) || Number.isNaN(Date.parse(at)))
    )
      push('publishedAt', `publishedAt "${at}" is not a valid date`);
    const origin = post['origin'];
    if (origin !== undefined && origin !== 'manual' && origin !== 'rss')
      push('origin', `origin "${origin}" must be manual or rss`);
  });
  return issues;
}

/** DS-16: a client's name is not blank, its type is client or company, its website is https and its logo lives under src/assets/clients. */
export function clientEntries(data: DataSet): Issue[] {
  const issues: Issue[] = [];
  asArray(data['clients']).forEach((c, i) => {
    if (!isObject(c)) return;
    const push = (key: string, message: string) =>
      issues.push({
        file: file('clients'),
        path: `/${i}${key ? `/${key}` : ''}`,
        message,
        rule: 'DS-16',
      });
    // A missing field is the schema's job (DS-02); these check the values that are there.
    if (typeof c['name'] === 'string' && !c['name'].trim()) push('name', 'a client needs a name');
    if (c['type'] !== undefined && c['type'] !== 'client' && c['type'] !== 'company')
      push('type', `type "${c['type']}" must be client or company`);
    const website = c['website'];
    if (
      typeof website === 'string' &&
      !website.startsWith('https://') &&
      !/^http:\/\//i.test(website)
    )
      push('website', `website "${website}" must start with https://`);
    const logo = c['logo'];
    if (typeof logo === 'string' && !toAssetPath(logo).startsWith('clients/'))
      push('logo', `logo "${logo}" must live under src/assets/clients`);
  });
  return issues;
}

/** DS-17: the profile photo has alt text, and its width and height match the image file. */
export function profilePhoto(data: DataSet, ctx: RuleContext): Issue[] {
  const profile = data['profile'];
  if (!isObject(profile) || !isObject(profile['photo'])) return [];
  const photo = profile['photo'];
  const issues: Issue[] = [];
  const push = (key: string, message: string) =>
    issues.push({ file: file('profile'), path: `/photo/${key}`, message, rule: 'DS-17' });
  if (typeof photo['alt'] !== 'string' || !photo['alt'].trim())
    push('alt', 'the photo needs alt text');
  const src = str(photo['src']);
  if (src && ctx.imageSize && ctx.assetExists(toAssetPath(src))) {
    const size = ctx.imageSize(toAssetPath(src));
    if (!size) push('src', `can't read the size of "${src}" (use PNG, JPEG or WebP)`);
    else {
      for (const key of ['width', 'height'] as const) {
        if (photo[key] !== size[key])
          push(key, `${key} is ${photo[key]} but "${src}" is ${size[key]}px`);
      }
    }
  }
  return issues;
}

export const RULES = [
  uniqueIds,
  noInsecureLinks,
  skillReferences,
  trackReferences,
  privateProjects,
  publicProjectLinks,
  featuredProjects,
  assetsExist,
  dateFormat,
  dateOrder,
  roleOverlap,
  textLengths,
  contactFormats,
  siteSettings,
  blogFields,
  clientEntries,
  profilePhoto,
];

export function runRules(data: DataSet, ctx: RuleContext): Issue[] {
  return RULES.flatMap((rule) => rule(data, ctx));
}
