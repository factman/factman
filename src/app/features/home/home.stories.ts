import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { SITE } from '@core/config';
import { site } from '@data/site';
import { resolveSite } from '@shared';
import { expect } from 'storybook/test';

import { Home } from './home';

/** Smoke story: renders the home page shell and runs axe on it. */
const meta: Meta<Home> = {
  title: 'Pages/Home',
  component: Home,
  // The page links to other routes.
  decorators: [
    applicationConfig({
      providers: [provideRouter([]), { provide: SITE, useValue: resolveSite(site, 'production') }],
    }),
  ],
};
export default meta;

type Story = StoryObj<Home>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // The hero's block loads at once on a client-side render (ETE-124), in its own chunk.
    await expect(
      await canvas.findByRole(
        'heading',
        { level: 1, name: 'Odunayo Mohammed' },
        { timeout: 5_000 },
      ),
    ).toBeVisible();
  },
};
