import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { TerminalCommand } from '@shared';

import { Terminal } from './terminal';

const commands: TerminalCommand[] = [
  { name: 'about', summary: 'Who I am', run: () => 'Fullstack engineer in Lagos.' },
  { name: 'echo', summary: 'Print', usage: 'echo <words>', run: (args) => args.join(' ') },
];

async function setup() {
  const run = vi.fn();
  const closed = vi.fn();
  const view = await render(Terminal, {
    inputs: { open: true, commands },
    on: { run, closed },
  });
  const field = screen.getByRole('textbox', { name: 'Command' });
  const log = () => screen.getByRole('log', { name: 'Terminal output' });
  return { ...view, field, log, run, closed, user: userEvent.setup() };
}

describe('Terminal', () => {
  it('opens as a dialog with the prompt focused', async () => {
    const { field } = await setup();
    expect(screen.getByRole('dialog', { name: 'Terminal' })).toBeTruthy();
    expect(document.activeElement).toBe(field);
  });

  it('echoes the line, prints the output and reports the command name', async () => {
    const { field, log, run, user } = await setup();
    await user.type(field, 'ABOUT{Enter}');
    expect(log().textContent).toContain('ABOUT');
    expect(log().textContent).toContain('Fullstack engineer in Lagos.');
    expect(run).toHaveBeenCalledWith('about');
    expect((field as HTMLInputElement).value).toBe('');
  });

  it('lists the commands for help and says "command not found" for anything else', async () => {
    const { field, log, user } = await setup();
    await user.type(field, 'help{Enter}');
    expect(log().textContent).toContain('echo <words>');
    await user.type(field, 'sudo{Enter}');
    const error = [...log().querySelectorAll('.is-error')].at(-1)!;
    expect(error.textContent).toContain('bash: sudo: command not found');
  });

  it('recalls earlier lines with ArrowUp and ArrowDown', async () => {
    const { field, user } = await setup();
    await user.type(field, 'echo one{Enter}');
    await user.type(field, 'echo two{Enter}');
    await user.keyboard('{ArrowUp}');
    expect((field as HTMLInputElement).value).toBe('echo two');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect((field as HTMLInputElement).value).toBe('echo one');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect((field as HTMLInputElement).value).toBe('');
  });

  it('empties the screen on clear', async () => {
    const { field, log, user } = await setup();
    await user.type(field, 'about{Enter}');
    await user.type(field, 'clear{Enter}');
    expect(log().children).toHaveLength(0);
  });

  it("asks to close on Escape (the dialog's cancel event)", async () => {
    const { closed } = await setup();
    // jsdom does not turn Escape into the dialog's cancel event; browsers do.
    screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(closed).toHaveBeenCalled();
  });
});
