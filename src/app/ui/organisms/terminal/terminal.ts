import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { runCommand, type TerminalCommand } from '@shared';
import { Dialog, WindowFrame } from '@ui/molecules';

/** One entry in the terminal's scrollback: a typed line or what it printed. */
interface LogLine {
  id: number;
  kind: 'input' | 'out' | 'error';
  text: string;
}

/**
 * The interactive terminal (FR-36, P1): a `bash` window in the shared Dialog, so focus stays
 * inside and Escape closes it. Type a command and press Enter; ArrowUp and ArrowDown recall
 * earlier lines; `help` lists the commands and `clear` empties the screen. The page gives the
 * commands (built from the data); output is plain text in a `role="log"` region that screen
 * readers announce. `run` reports each command name, for analytics.
 * @level organism
 */
@Component({
  selector: 'fm-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // terminal* classes are this component's; fm-term__* come from the design system.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './terminal.scss',
  imports: [Dialog, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './terminal.html',
})
export class Terminal {
  readonly open = input(false);
  readonly commands = input<readonly TerminalCommand[]>([]);
  /** The prompt's user and path: `odunayo:~$`. */
  readonly user = input('odunayo');
  readonly path = input('~');
  /** The first lines, before anything is typed. */
  readonly greeting = input('Type help to see the commands. Escape closes the terminal.');

  readonly closed = output<void>();
  /** A command that ran (its name, never its arguments). */
  readonly run = output<string>();

  protected readonly lines = signal<LogLine[]>([]);
  protected readonly draft = signal('');
  private readonly history: string[] = [];
  /** Where ArrowUp/ArrowDown are in the history; history.length is the new line. */
  private cursor = 0;
  private nextId = 0;

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  constructor() {
    // Focus the prompt whenever the terminal opens, and keep the newest line in view.
    afterRenderEffect(() => {
      if (this.open()) this.field()?.nativeElement.focus({ preventScroll: true });
    });
    afterRenderEffect(() => {
      this.lines();
      const body = this.body()?.nativeElement;
      if (body) body.scrollTop = body.scrollHeight;
    });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const line = this.draft();
    this.draft.set('');
    const result = runCommand(this.commands(), line);
    if (line.trim()) {
      this.history.push(line);
      this.run.emit(line.trim().split(/\s+/)[0].toLowerCase());
    }
    this.cursor = this.history.length;
    if (result.kind === 'clear') {
      this.lines.set([]);
      return;
    }
    const echo: LogLine = { id: this.nextId++, kind: 'input', text: line };
    const out: LogLine[] =
      result.kind === 'empty' ? [] : [{ id: this.nextId++, kind: result.kind, text: result.text }];
    this.lines.update((lines) => [...lines, echo, ...out]);
  }

  /** ArrowUp and ArrowDown walk the history; past the newest line is an empty prompt. */
  protected recall(event: KeyboardEvent): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    if (this.history.length === 0) return;
    event.preventDefault();
    const step = event.key === 'ArrowUp' ? -1 : 1;
    this.cursor = Math.min(this.history.length, Math.max(0, this.cursor + step));
    this.draft.set(this.history[this.cursor] ?? '');
  }

  /** A click anywhere in the window puts the caret back in the prompt. */
  protected focusPrompt(): void {
    this.field()?.nativeElement.focus({ preventScroll: true });
  }
}
