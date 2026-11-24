import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
} from '@angular/core';

import type { Token } from '../code-block/highlight';
import { CopyButton } from '../copy-button/copy-button';
import { WindowFrame } from '../window-frame/window-frame';

/**
 * A file in the editor, already highlighted: `lines` come from `highlight()` run at build time
 * (scripts/data/generate-hero-code.ts), so the editor itself carries no highlighter.
 */
export interface EditorFile {
  readonly name: string;
  /** Shown in the status bar: `ts` → TS. */
  readonly language: string;
  readonly lines: readonly (readonly Token[])[];
  /** 1-based lines to highlight. */
  readonly highlightLines?: readonly number[];
}

/**
 * The design system's code editor: a code window with file tabs (when there is more than one
 * file), line numbers, highlighted lines, a copy button and a status bar (branch, cursor,
 * language). Below 768px it drops the line numbers and status bar, and long lines wrap.
 *
 * `decorative` is for the hero, whose text already says everything the code shows: the editor is
 * then hidden from screen readers and inert (no copy button, no focus), so nothing is read twice.
 * @level molecule
 */
@Component({
  selector: 'fm-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './code-editor.scss',
  imports: [CopyButton, WindowFrame],
  host: {
    style: 'display: contents',
  },
  templateUrl: './code-editor.html',
})
export class CodeEditor {
  readonly files = input.required<readonly EditorFile[]>();
  /** The index of the file shown; the tabs change it. */
  readonly activeFile = model(0);
  /** The accent glow around the window, for the hero. */
  readonly glow = input(false);
  readonly statusBar = input(true);
  readonly branch = input('main');
  /** Hidden from assistive tech and inert: for code that repeats text on the page. */
  readonly decorative = input(false);

  protected readonly file = computed(() => this.files()[this.activeFile()] ?? this.files()[0]);
  protected readonly tabbed = computed(() => this.files().length > 1);
  protected readonly code = computed(() =>
    this.file()
      .lines.map((line) => line.map((t) => t.text).join(''))
      .join('\n'),
  );
  /** The cursor at the end of the file, as the status bar shows it. */
  protected readonly cursor = computed(() => {
    const lines = this.file().lines;
    const last = lines.at(-1) ?? [];
    return `Ln ${lines.length}, Col ${last.reduce((n, t) => n + t.text.length, 0) + 1}`;
  });

  protected isHighlighted(line: number): boolean {
    return this.file().highlightLines?.includes(line) ?? false;
  }

  protected select(index: number): void {
    this.activeFile.set(index);
  }

  /** Arrow keys, Home and End move between the file tabs (WAI-ARIA tabs pattern). */
  protected onTabKey(event: KeyboardEvent, index: number): void {
    const count = this.files().length;
    const next = {
      ArrowRight: (index + 1) % count,
      ArrowLeft: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    this.select(next);
    const tabs = (event.currentTarget as HTMLElement).parentElement?.children;
    (tabs?.[next] as HTMLElement | undefined)?.focus();
  }
}
