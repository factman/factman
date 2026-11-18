/**
 * Atomic Design layers for eslint-plugin-boundaries.
 * Paths are matched with a leading "**" so the same rules apply to the
 * violation fixtures under tools/eslint/fixtures.
 */
export const elements = [
  { type: 'tokens', pattern: '**/src/app/ui/tokens' },
  { type: 'atoms', pattern: '**/src/app/ui/atoms' },
  { type: 'molecules', pattern: '**/src/app/ui/molecules' },
  { type: 'organisms', pattern: '**/src/app/ui/organisms' },
  { type: 'templates', pattern: '**/src/app/ui/templates' },
  { type: 'pages', pattern: '**/src/app/features/*', capture: ['name'] },
  { type: 'data', pattern: '**/src/app/data' },
  { type: 'core', pattern: '**/src/app/core/*', capture: ['name'] },
  { type: 'shared', pattern: '**/src/app/shared' },
  { type: 'app', pattern: '**/src/app/app*.ts', partialMatch: false },
  { type: 'app', pattern: '**/src/{main,main.server,server}.ts', partialMatch: false },
];

const ui = ['tokens', 'atoms', 'molecules', 'organisms', 'templates'];

/** "May depend on" table. Keep docs/atomic-design.md in sync. */
export const mayDependOn = {
  tokens: [],
  atoms: ['tokens'],
  molecules: ['tokens', 'atoms', 'shared'],
  organisms: ['tokens', 'atoms', 'molecules', 'shared'],
  templates: ['tokens', 'atoms', 'molecules', 'organisms', 'shared'],
  pages: [...ui, 'pages', 'core', 'shared', 'data'],
  data: ['shared'],
  core: ['core', 'shared', 'data'],
  shared: [],
  app: ['app', 'pages', 'core', 'shared'],
};

export const policies = Object.entries(mayDependOn)
  .filter(([, to]) => to.length > 0)
  .map(([from, to]) => ({
    from: { element: { type: from } },
    allow: { to: { element: { types: to } } },
  }));
