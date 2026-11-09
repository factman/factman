/**
 * Requires every Angular component under ui/<level>/ or features/ to carry a
 * JSDoc `@level <level>` tag that matches its folder.
 */
const LEVEL_BY_FOLDER = [
  [
    /[\\/]src[\\/]app[\\/]ui[\\/](atoms|molecules|organisms|templates)[\\/]/,
    (m) => m[1].slice(0, -1),
  ],
  [/[\\/]src[\\/]app[\\/]features[\\/]/, () => 'page'],
];

export const levelTagRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Require a matching @level tag on Atomic Design components' },
    schema: [],
    messages: {
      missing: 'Component in a "{{level}}" folder needs a JSDoc "@level {{level}}" tag.',
      mismatch: 'Component tagged "@level {{actual}}" lives in a "{{level}}" folder.',
    },
  },
  create(context) {
    const file = context.filename;
    let expected;
    for (const [re, toLevel] of LEVEL_BY_FOLDER) {
      const m = file.match(re);
      if (m) {
        expected = toLevel(m);
        break;
      }
    }
    if (!expected || /\.(spec|stories)\.ts$/.test(file)) return {};
    return {
      Decorator(node) {
        const callee = node.expression?.callee;
        if (callee?.name !== 'Component') return;
        const cls = node.parent;
        const comments = [
          ...context.sourceCode.getCommentsBefore(node),
          ...(cls.parent?.type === 'ExportNamedDeclaration'
            ? context.sourceCode.getCommentsBefore(cls.parent)
            : []),
        ];
        const tag = comments.map((c) => c.value.match(/@level\s+(\w+)/)).find(Boolean);
        if (!tag) context.report({ node, messageId: 'missing', data: { level: expected } });
        else if (tag[1] !== expected)
          context.report({
            node,
            messageId: 'mismatch',
            data: { level: expected, actual: tag[1] },
          });
      },
    };
  },
};
