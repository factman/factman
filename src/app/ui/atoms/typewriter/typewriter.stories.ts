import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { Typewriter } from './typewriter';

/** Types, holds and erases words with a caret. Reduced motion shows the first word only. */
const meta: Meta<Typewriter> = {
  title: 'Atoms/Typewriter',
  component: Typewriter,
  args: {
    words: ['Fullstack engineer', 'CTO', 'Mobile developer'],
    prefix: "I'm a",
    loop: true,
    caret: true,
  },
  render: (args) => ({
    props: args,
    template: `<p style="margin: 0; font: 600 28px/1.3 var(--font-sans); color: var(--text-primary)"><fm-typewriter [words]="words" [prefix]="prefix" [loop]="loop" [caret]="caret" /></p>`,
  }),
};
export default meta;

type Story = StoryObj<Typewriter>;

export const Roles: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("I'm a Fullstack engineer, CTO, Mobile developer"),
    ).toBeInTheDocument();
  },
};

export const NoCaret: Story = { args: { caret: false, prefix: undefined } };
