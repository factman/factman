import type { Preview } from '@storybook/angular-vite';

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
