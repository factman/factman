import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';

import type { TerminalCommand } from '@shared';

import { Terminal } from './terminal';

const commands: TerminalCommand[] = [
  {
    name: 'about',
    summary: 'Who Odunayo is',
    run: () => 'Odunayo Mohammed, fullstack software engineer and technical leader in Lagos.',
  },
  {
    name: 'contact',
    summary: 'How to reach Odunayo',
    run: () => 'Email     hello@example.com\nGitHub    https://github.com/example',
  },
];

/**
 * The interactive terminal (FR-36, P1), opened with Ctrl/Cmd+K or the hero's button when
 * site.json `features.terminal` is on. The page passes the commands; `help` and `clear` are
 * built in.
 */
const meta: Meta<Terminal> = {
  title: 'Organisms/Terminal',
  component: Terminal,
  args: { open: true, commands },
};
export default meta;

type Story = StoryObj<Terminal>;

export const Open: Story = {};

export const AfterHelp: Story = {
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    const field = dialog.getByRole('textbox', { name: 'Command' });
    await userEvent.type(field, 'help{Enter}');
    await userEvent.type(field, 'whoami{Enter}');
    const log = dialog.getByRole('log', { name: 'Terminal output' });
    await expect(log.textContent).toContain('Available commands:');
    await expect(log.textContent).toContain('bash: whoami: command not found');
  },
};
