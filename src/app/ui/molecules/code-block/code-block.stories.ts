import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { CodeBlock } from './code-block';

/** A code sample in an editor window, with syntax colours and a copy button. */
const meta: Meta<CodeBlock> = {
  title: 'Molecules/CodeBlock',
  component: CodeBlock,
  argTypes: {
    language: { control: 'select', options: ['ts', 'js', 'json', 'bash', 'html', 'text'] },
  },
  args: {
    filename: 'odunayo.ts',
    language: 'ts',
    lineNumbers: true,
    code: `// Fullstack engineer, CTO at Simple Finance
export const odunayo = {
  role: 'Fullstack engineer',
  years: 12,
  stack: ['TypeScript', 'Angular', 'Node.js'],
  available: true,
};

hire(odunayo);`,
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 560px"><fm-code-block [code]="code" [language]="language" [filename]="filename" [lineNumbers]="lineNumbers" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<CodeBlock>;

export const TypeScript: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'odunayo.ts' })).toBeVisible();
  },
};

export const Json: Story = {
  args: {
    filename: 'availability.json',
    language: 'json',
    code: '{\n  "status": "available",\n  "replies": "within 24 hours"\n}',
  },
};

export const Shell: Story = {
  args: {
    filename: 'terminal',
    language: 'bash',
    lineNumbers: false,
    code: 'pnpm install\npnpm nx run factman:serve --open',
  },
};
