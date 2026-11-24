import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

import { highlight } from '../code-block/highlight';
import { CodeEditor, type EditorFile } from './code-editor';

const PROFILE_TS = `const profile = {
  name: "Odunayo Mohammed",
  role: "Fullstack Software Engineer and CTO",
  base: "Lagos, Nigeria",
  since: 2013,
  stack: ["Angular", "Node.js", "TypeScript"],
};`;

/** The hero's file, highlighted here as scripts/data/generate-hero-code.ts does at build time. */
const profileTs: EditorFile = {
  name: 'profile.ts',
  language: 'ts',
  lines: highlight(PROFILE_TS, 'ts'),
  highlightLines: [6],
};

const readme: EditorFile = {
  name: 'README.md',
  language: 'md',
  lines: [
    [{ text: '# Odunayo Mohammed' }],
    [{ text: '' }],
    [{ text: 'Fullstack Software Engineer and CTO in Lagos.' }],
  ],
};

/**
 * The code editor: a code window with file tabs, line numbers, a highlighted line, copy and a
 * status bar. Files come highlighted (the hero's profile.ts is generated at build time).
 * `decorative` hides it from assistive tech, for the hero.
 */
const meta: Meta<CodeEditor> = {
  title: 'Molecules/CodeEditor',
  component: CodeEditor,
  args: { files: [profileTs], glow: false, statusBar: true, decorative: false },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 560px"><fm-code-editor [files]="files" [glow]="glow" [statusBar]="statusBar" [decorative]="decorative" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<CodeEditor>;

export const ProfileFile: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'profile.ts source' })).toBeVisible();
  },
};

export const Tabs: Story = {
  args: { files: [profileTs, readme] },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'README.md' }));
    await expect(canvas.getByRole('region', { name: 'README.md source' })).toBeVisible();
  },
};

export const HeroGlow: Story = { args: { glow: true, decorative: true } };
