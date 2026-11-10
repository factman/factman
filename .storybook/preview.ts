import type { Preview } from '@storybook/angular-vite';

// The global styles angular.json loads on every page, in the same order: tokens, self-hosted
// fonts, the design system's shared CSS, then the app's own. Stories render with the real tokens.
import '../src/styles/factman/tokens.css';
import '../src/styles/generated/fonts.css';
import '../src/styles/factman/global.css';
import '../src/styles.scss';

const preview: Preview = {
  // Theme toolbar (FR-04): renders every story in Light or Dark by setting data-theme on <html>,
  // as ThemeService does in the app. A story can pin one with `globals: { theme: 'dark' }`.
  globalTypes: {
    theme: {
      description: 'Light or Dark theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      document.documentElement.setAttribute('data-theme', String(context.globals['theme']));
      return story();
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // Any axe violation fails the story test (and CI).
      test: 'error',
    },
  },
};

export default preview;
