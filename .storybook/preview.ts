import type { Preview } from '@storybook/angular-vite';

// The global styles angular.json loads on every page, in the same order: tokens, self-hosted
// fonts, the design system's shared CSS, then the app's own. Stories render with the real tokens.
import '../src/styles/factman/tokens.css';
import '../src/styles/generated/fonts.css';
import '../src/styles/factman/global.css';
import '../src/styles.scss';

const preview: Preview = {
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
