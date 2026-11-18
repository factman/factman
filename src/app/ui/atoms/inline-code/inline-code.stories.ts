import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { InlineCode } from './inline-code';

/** Code inside a sentence, in the mono font. */
const meta: Meta<InlineCode> = {
  title: 'Atoms/InlineCode',
  component: InlineCode,
  render: () => ({
    template: `<p style="font: var(--text-body-md, 16px/1.6 var(--font-sans)); color: var(--text-primary)">Run <fm-inline-code>pnpm build</fm-inline-code> before you deploy.</p>`,
  }),
};
export default meta;

export const InSentence: StoryObj<InlineCode> = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('pnpm build').tagName).toBe('CODE');
  },
};
