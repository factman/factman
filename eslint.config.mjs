// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import boundaries from 'eslint-plugin-boundaries';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

import { elements, policies } from './tools/eslint/atomic-levels.mjs';
import { levelTagRule } from './tools/eslint/level-tag-rule.mjs';

export default defineConfig([
  {
    ignores: [
      'dist/',
      'coverage/',
      '.angular/',
      'storybook-static/',
      'playwright-report/',
      'test-results/',
      'tools/eslint/fixtures/',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'fm', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'fm', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  // Atomic Design layering (PRD section 9): dependencies run one way.
  {
    files: ['src/**/*.ts', 'tools/eslint/fixtures/**/*.ts'],
    plugins: { boundaries, atomic: { rules: { 'level-tag': levelTagRule } } },
    settings: {
      'boundaries/elements': elements,
      'boundaries/include': ['**/src/**/*.ts'],
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Atomic Design: "{{ from.element.type }}" may not depend on "{{ to.element.type }}". See docs/atomic-design.md.',
          policies,
        },
      ],
      'atomic/level-tag': 'error',
    },
  },
  {
    files: ['src/**/*.spec.ts', 'src/**/*.stories.ts'],
    rules: { 'boundaries/dependencies': 'off' },
  },
]);
