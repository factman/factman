/**
 * UI-03 (PRD §12): organisms, code. CodeEditor switches files from the keyboard, copies the plain
 * code, and is inert when decorative. Terminal accepts input, recalls history with the arrow
 * keys, and handles unknown commands, `clear` and Escape.
 *
 * The canvas's CodeEditor shows its file at once (the hero's typing is the Typewriter's roles,
 * UI-01), so there is no typing to skip; nothing in it moves, with or without reduced motion.
 */
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { TerminalCommand } from '@shared';
import { CodeEditor, type EditorFile } from '@ui/molecules/code-editor/code-editor';
import { Terminal } from '@ui/organisms/terminal/terminal';

const profileTs: EditorFile = {
  name: 'profile.ts',
  language: 'ts',
  lines: [[{ text: 'const profile = {' }], [{ text: '  since: 2013,' }], [{ text: '};' }]],
};
const readme: EditorFile = { name: 'README.md', language: 'md', lines: [[{ text: '# Odunayo' }]] };

const commands: TerminalCommand[] = [
  { name: 'about', summary: 'Who I am', run: () => 'Fullstack engineer in Lagos.' },
  { name: 'echo', summary: 'Print', usage: 'echo <words>', run: (args) => args.join(' ') },
];

describe('UI-03 Organisms: code', () => {
  afterEach(() => vi.unstubAllGlobals());

  describe('CodeEditor', () => {
    it('switches files with the arrow keys; the tab list is one tab stop', async () => {
      await render(CodeEditor, { inputs: { files: [profileTs, readme] } });
      const user = userEvent.setup();
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      // Roving tab index: only the selected tab is in the tab order.
      expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1]);
      tabs[0].focus();
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
      expect(screen.getAllByRole('tab')[1].getAttribute('aria-selected')).toBe('true');
      expect(screen.getByRole('region', { name: 'README.md source' }).textContent).toContain(
        '# Odunayo',
      );
      await user.keyboard('{ArrowRight}');
      expect(screen.getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
    });

    it('copies the plain code from the keyboard and says so', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      await render(CodeEditor, { inputs: { files: [profileTs] } });
      screen.getByRole('button', { name: /Copy/ }).focus();
      await userEvent.keyboard('{Enter}');
      expect(writeText).toHaveBeenCalledWith('const profile = {\n  since: 2013,\n};');
      expect((await screen.findAllByText(/Copied/)).length).toBeGreaterThan(0);
    });

    it('is hidden from assistive tech and out of the tab order when decorative', async () => {
      const { container } = await render(CodeEditor, {
        inputs: { files: [profileTs], decorative: true },
      });
      const editor = container.querySelector('.code-editor')!;
      expect(editor.getAttribute('aria-hidden')).toBe('true');
      expect(editor.hasAttribute('inert')).toBe(true);
      await userEvent.tab();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('Terminal', () => {
    const setup = async () => {
      const closed = vi.fn();
      await render(Terminal, { inputs: { open: true, commands }, on: { closed } });
      const field = screen.getByRole('textbox', { name: 'Command' }) as HTMLInputElement;
      const log = () => screen.getByRole('log', { name: 'Terminal output' });
      return { field, log, closed, user: userEvent.setup() };
    };

    it('takes input with focus on the prompt, and answers known and unknown commands', async () => {
      const { field, log, user } = await setup();
      expect(document.activeElement).toBe(field);
      await user.keyboard('about{Enter}');
      expect(log().textContent).toContain('Fullstack engineer in Lagos.');
      await user.keyboard('sudo rm -rf{Enter}');
      expect(log().textContent).toContain('bash: sudo: command not found');
      expect(field.value).toBe('');
    });

    it('recalls history with ArrowUp and ArrowDown, and clear empties the screen', async () => {
      const { field, log, user } = await setup();
      await user.keyboard('echo one{Enter}echo two{Enter}');
      await user.keyboard('{ArrowUp}');
      expect(field.value).toBe('echo two');
      await user.keyboard('{ArrowUp}');
      expect(field.value).toBe('echo one');
      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(field.value).toBe('');
      await user.keyboard('clear{Enter}');
      expect(log().children).toHaveLength(0);
    });

    it('asks to close on Escape (the dialog cancel event)', async () => {
      const { closed } = await setup();
      // jsdom does not turn Escape into the dialog's cancel event; browsers do.
      screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
      expect(closed).toHaveBeenCalled();
    });

    it('prints without animation, so reduced motion changes nothing', async () => {
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
      const { log, user } = await setup();
      await user.keyboard('about{Enter}');
      expect(log().textContent).toContain('Fullstack engineer in Lagos.');
    });
  });
});
