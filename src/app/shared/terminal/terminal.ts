import { Injectable, InjectionToken, signal } from '@angular/core';

/**
 * One command of the interactive terminal (FR-36). `run` gets the words after the name and
 * returns the plain text to print; it may act too (`theme dark` switches the theme).
 */
export interface TerminalCommand {
  name: string;
  /** One line for `help`. */
  summary: string;
  /** How to call it, when it takes arguments: `theme [light|dark|system|toggle]`. */
  usage?: string;
  run(args: readonly string[]): string;
}

/** A typed line, split into the command name (lower case) and its arguments. */
export interface ParsedCommand {
  name: string;
  args: string[];
}

/** What a line printed: plain output, an error, or `clear` (the host empties its log). */
export interface TerminalResult {
  kind: 'out' | 'error' | 'clear' | 'empty';
  text: string;
}

/**
 * Splits a typed line into words: whitespace separates them, and "double" or 'single' quotes
 * keep spaces inside one. An empty or blank line gives undefined.
 */
export function parseCommand(line: string): ParsedCommand | undefined {
  const words = [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
  if (words.length === 0) return undefined;
  const [name, ...args] = words;
  return { name: name.toLowerCase(), args };
}

/** The `help` listing: every command with its usage and summary, in registry order. */
export function helpText(commands: readonly TerminalCommand[]): string {
  const rows = [
    ...commands.map((c) => [c.usage ?? c.name, c.summary] as const),
    ['help', 'List these commands'] as const,
    ['clear', 'Clear the screen'] as const,
  ];
  const width = Math.max(...rows.map(([usage]) => usage.length));
  return ['Available commands:', ...rows.map(([u, s]) => `  ${u.padEnd(width)}  ${s}`)].join('\n');
}

/**
 * Runs a typed line against the registry. `help` and `clear` are built in; an unknown name prints
 * bash's "command not found" with a hint, and a command that throws prints its message.
 */
export function runCommand(commands: readonly TerminalCommand[], line: string): TerminalResult {
  const parsed = parseCommand(line);
  if (!parsed) return { kind: 'empty', text: '' };
  if (parsed.name === 'help') return { kind: 'out', text: helpText(commands) };
  if (parsed.name === 'clear') return { kind: 'clear', text: '' };
  const command = commands.find((c) => c.name === parsed.name);
  if (!command) {
    return {
      kind: 'error',
      text: `bash: ${parsed.name}: command not found. Type help to see the commands.`,
    };
  }
  try {
    return { kind: 'out', text: command.run(parsed.args) };
  } catch (error) {
    return { kind: 'error', text: `${parsed.name}: ${(error as Error).message}` };
  }
}

/**
 * Whether the interactive terminal ships (site.json `features.terminal`, a P1 flag; CoreModule
 * provides it). Defaults to off.
 */
export const TERMINAL_ENABLED = new InjectionToken<boolean>('fm.terminal', {
  providedIn: 'root',
  factory: () => false,
});

/**
 * Opens and closes the terminal from anywhere: the hero's button and Ctrl/Cmd+K. The app shell
 * loads the terminal's chunk the first time it opens.
 */
@Injectable({ providedIn: 'root' })
export class TerminalLauncher {
  readonly open = signal(false);
  /** True once the terminal has been asked for, so its chunk loads and then stays. */
  readonly requested = signal(false);

  show(): void {
    this.requested.set(true);
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }

  toggle(): void {
    if (this.open()) this.hide();
    else this.show();
  }
}
