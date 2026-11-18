import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';

import { generateTypes } from './generate-types';
import { formatIssue } from './issues';
import { validateData } from './validate';

const roots: string[] = [];
after(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

/** A throwaway repo root with src/data, src/data/schemas and src/assets. */
function fixture(files: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), 'data-validate-'));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, typeof content === 'string' ? content : JSON.stringify(content));
  }
  mkdirSync(join(root, 'src/data/schemas'), { recursive: true });
  return root;
}

const clientsSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Clients',
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name', 'logo'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1 },
      logo: { type: 'string' },
      website: { type: 'string', format: 'uri', pattern: '^https://' },
    },
  },
};

describe('validateData', () => {
  test('passes with no data seeded yet', () => {
    const { issues, checked } = validateData(fixture({}));
    assert.deepEqual(issues, []);
    assert.deepEqual(checked, []);
  });

  test('passes valid data against its schema and rules', () => {
    const root = fixture({
      'src/data/clients.json': [
        { id: 1, name: 'A', logo: 'clients/a.png', website: 'https://a.dev' },
      ],
      'src/data/schemas/clients.schema.json': clientsSchema,
      'src/assets/clients/a.png': 'png',
    });
    const { issues, checked } = validateData(root);
    assert.deepEqual(issues, []);
    assert.deepEqual(checked, ['clients']);
  });

  test('reports schema errors with file and JSON path', () => {
    const root = fixture({
      'src/data/clients.json': [{ id: 'one', name: '', logo: 'clients/a.png', extra: true }],
      'src/data/schemas/clients.schema.json': clientsSchema,
      'src/assets/clients/a.png': 'png',
    });
    const lines = validateData(root).issues.map(formatIssue);
    assert.ok(
      lines.includes('src/data/clients.json /0: must NOT have additional properties "extra"'),
      lines.join('\n'),
    );
    assert.ok(lines.includes('src/data/clients.json /0/id: must be integer'), lines.join('\n'));
    assert.ok(
      lines.includes('src/data/clients.json /0/name: must NOT have fewer than 1 characters'),
      lines.join('\n'),
    );
  });

  test('reports rule errors (missing asset, duplicate id)', () => {
    const root = fixture({
      'src/data/clients.json': [
        { id: 1, name: 'A', logo: 'clients/missing.png' },
        { id: 1, name: 'B', logo: 'clients/missing.png' },
      ],
      'src/data/schemas/clients.schema.json': clientsSchema,
    });
    const lines = validateData(root).issues.map(formatIssue);
    assert.ok(
      lines.includes('src/data/clients.json /1/id: duplicate id "1" (also at /0)'),
      lines.join('\n'),
    );
    assert.ok(
      lines.some((l) => l.includes('missing asset "clients/missing.png"')),
      lines.join('\n'),
    );
  });

  test('requires a schema per data file, a data file per schema, and known file names', () => {
    const root = fixture({
      'src/data/services.json': [],
      'src/data/schemas/clients.schema.json': clientsSchema,
      'src/data/notes.json': {},
    });
    const lines = validateData(root).issues.map(formatIssue);
    assert.ok(
      lines.some((l) => l.startsWith('src/data/services.json: no schema')),
      lines.join('\n'),
    );
    assert.ok(
      lines.some((l) =>
        l.startsWith('src/data/schemas/clients.schema.json: schema has no data file'),
      ),
      lines.join('\n'),
    );
    assert.ok(
      lines.some((l) => l.startsWith('src/data/notes.json: unknown data file')),
      lines.join('\n'),
    );
  });

  test('reports invalid JSON and a missing schema title', () => {
    const root = fixture({
      'src/data/clients.json': '[{',
      'src/data/schemas/clients.schema.json': clientsSchema,
      'src/data/site.json': {},
      'src/data/schemas/site.schema.json': { type: 'object' },
    });
    const lines = validateData(root).issues.map(formatIssue);
    assert.ok(
      lines.some((l) => l.startsWith('src/data/clients.json: invalid JSON')),
      lines.join('\n'),
    );
    assert.ok(
      lines.some((l) => l.startsWith('src/data/schemas/site.schema.json: schema needs a "title"')),
      lines.join('\n'),
    );
  });
});

describe('generateTypes', () => {
  test('writes one model per schema and a barrel', async () => {
    const root = fixture({ 'src/data/schemas/clients.schema.json': clientsSchema });
    const names = await generateTypes(root);
    assert.deepEqual(names, ['clients']);
    const { readFileSync } = await import('node:fs');
    const model = readFileSync(join(root, 'src/app/shared/models/generated/clients.ts'), 'utf8');
    assert.match(model, /export type Clients = \{/);
    assert.match(model, /website\?: string;/);
    const barrel = readFileSync(join(root, 'src/app/shared/models/generated/index.ts'), 'utf8');
    assert.match(barrel, /export type \* from '\.\/clients';/);
  });
});
