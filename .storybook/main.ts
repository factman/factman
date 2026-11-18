import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: '@storybook/angular-vite',
  // angular.json copies src/assets to /assets; Storybook needs the same for fonts and logos.
  // The static build also ships at /storybook on the site (ETE-220, tools/build/add-storybook.mjs).
  staticDirs: ['../public', { from: '../src/assets', to: '/assets' }],
  // Same Sass load path as angular.json (stylePreprocessorOptions.includePaths), so component
  // styles can `@use 'factman/components/<section>'` in Storybook and its Vitest runs.
  viteFinal: (vite) => ({
    ...vite,
    css: {
      ...vite.css,
      preprocessorOptions: {
        ...vite.css?.preprocessorOptions,
        scss: {
          ...(vite.css?.preprocessorOptions?.['scss'] as object | undefined),
          loadPaths: [fileURLToPath(new URL('../src/styles', import.meta.url))],
        },
      },
    },
  }),
};
export default config;
