import {
  helpText,
  parseCommand,
  runCommand,
  type TerminalCommand,
  TerminalLauncher,
} from './terminal';

const echo: TerminalCommand = {
  name: 'echo',
  summary: 'Print the words',
  run: (args) => args.join(' '),
};
const boom: TerminalCommand = {
  name: 'boom',
  summary: 'Fails',
  run: () => {
    throw new Error('it broke');
  },
};
const theme: TerminalCommand = {
  name: 'theme',
  usage: 'theme [light|dark]',
  summary: 'Switch the theme',
  run: (args) => `theme: ${args[0] ?? 'light'}`,
};

describe('parseCommand', () => {
  it('splits on whitespace and lower-cases the name only', () => {
    expect(parseCommand('  Theme   Dark ')).toEqual({ name: 'theme', args: ['Dark'] });
  });

  it('keeps quoted words together, with either quote', () => {
    expect(parseCommand(`echo "hello world" 'a b' c`)).toEqual({
      name: 'echo',
      args: ['hello world', 'a b', 'c'],
    });
  });

  it('gives undefined for an empty or blank line', () => {
    expect(parseCommand('')).toBeUndefined();
    expect(parseCommand('   \t ')).toBeUndefined();
  });
});

describe('runCommand', () => {
  const commands = [echo, boom, theme];

  it('runs a command with its arguments', () => {
    expect(runCommand(commands, 'echo hi there')).toEqual({ kind: 'out', text: 'hi there' });
    expect(runCommand(commands, 'THEME dark')).toEqual({ kind: 'out', text: 'theme: dark' });
  });

  it('answers help with every command, help and clear, aligned', () => {
    const { kind, text } = runCommand(commands, 'help');
    expect(kind).toBe('out');
    expect(text).toBe(helpText(commands));
    const lines = text.split('\n');
    expect(lines[0]).toBe('Available commands:');
    expect(lines.map((l) => l.trim().split(/\s{2,}/)[0])).toEqual([
      'Available commands:',
      'echo',
      'boom',
      'theme [light|dark]',
      'help',
      'clear',
    ]);
    // The summaries start in one column, after the longest usage.
    expect(lines[1]).toBe(`  ${'echo'.padEnd(18)}  Print the words`);
    expect(lines[3]).toBe('  theme [light|dark]  Switch the theme');
  });

  it('returns clear, and empty for a blank line', () => {
    expect(runCommand(commands, 'clear').kind).toBe('clear');
    expect(runCommand(commands, '  ').kind).toBe('empty');
  });

  it('prints "command not found" with a hint for an unknown name', () => {
    expect(runCommand(commands, 'sudo rm -rf /')).toEqual({
      kind: 'error',
      text: 'bash: sudo: command not found. Type help to see the commands.',
    });
  });

  it('prints the message of a command that throws', () => {
    expect(runCommand(commands, 'boom')).toEqual({ kind: 'error', text: 'boom: it broke' });
  });
});

describe('TerminalLauncher', () => {
  it('opens, closes and toggles, and remembers it was requested', () => {
    const launcher = new TerminalLauncher();
    expect(launcher.requested()).toBe(false);
    launcher.toggle();
    expect([launcher.open(), launcher.requested()]).toEqual([true, true]);
    launcher.toggle();
    expect([launcher.open(), launcher.requested()]).toEqual([false, true]);
    launcher.show();
    launcher.hide();
    expect(launcher.open()).toBe(false);
  });
});
