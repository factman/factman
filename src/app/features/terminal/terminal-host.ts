import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '@core/theme';
import { contact } from '@data/contact';
import { experience } from '@data/experience';
import { profile } from '@data/profile';
import { projects } from '@data/projects';
import { resumes } from '@data/resumes';
import { skills } from '@data/skills';
import { ANALYTICS_TRACKER, CLOCK, TerminalLauncher } from '@shared';
import { Terminal } from '@ui/organisms/terminal/terminal';

import { terminalCommands } from './terminal-commands';

/**
 * The interactive terminal (FR-36) with its commands built from the data files. The app shell
 * loads it lazily, the first time Ctrl/Cmd+K or the hero's button opens it, so neither it nor
 * the data it reads is in the initial bundle.
 * @level page
 */
@Component({
  selector: 'fm-terminal-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Terminal],
  template: `<fm-terminal
    [open]="launcher.open()"
    [commands]="commands"
    (closed)="launcher.hide()"
    (run)="ran($event)"
  />`,
})
export class TerminalHost {
  protected readonly launcher = inject(TerminalLauncher);
  private readonly theme = inject(ThemeService);
  protected readonly commands = terminalCommands({
    profile,
    experience,
    skills,
    projects,
    contact,
    resumes: resumes.resumes,
    theme: (arg) => this.theme.command(arg),
    now: inject(CLOCK)(),
  });

  private readonly tracker = inject(ANALYTICS_TRACKER);
  /** Command names that may be reported: the terminal's own, plus help and clear. */
  private readonly known = new Set(['help', 'clear', ...this.commands.map((c) => c.name)]);

  /** Sends terminal_command for a known command; anything else typed is never sent. */
  protected ran(name: string): void {
    if (this.known.has(name)) this.tracker.track('terminal_command', { command: name });
  }
}
