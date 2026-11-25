import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoreModule } from '@core';
import { ANALYTICS_TRACKER, TerminalLauncher } from '@shared';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TerminalHost } from './terminal-host';

describe('TerminalHost analytics (terminal_command)', () => {
  it('sends the names of known commands only, never other typed text', async () => {
    const track = vi.fn();
    await render(TerminalHost, {
      providers: [
        importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
        { provide: ANALYTICS_TRACKER, useValue: { track } },
      ],
    });
    TestBed.inject(TerminalLauncher).show();
    const input = await screen.findByRole('textbox', { name: 'Command' });
    await userEvent.type(input, 'skills{Enter}');
    await userEvent.type(input, 'help{Enter}');
    await userEvent.type(input, 'my secret{Enter}');
    expect(track.mock.calls).toEqual([
      ['terminal_command', { command: 'skills' }],
      ['terminal_command', { command: 'help' }],
    ]);
  });
});
