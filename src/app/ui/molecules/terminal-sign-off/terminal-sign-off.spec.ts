import { render, screen } from '@testing-library/angular';

import { TerminalSignOff } from './terminal-sign-off';

describe('TerminalSignOff', () => {
  it('prints the command and a sign-off with the heart read as "love"', async () => {
    const { container } = await render(TerminalSignOff);
    expect(screen.getByText('echo "Built with love by Factman"')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'love' })).toBeTruthy();
    expect(container.querySelector('.fm-window__bar')).toBeNull();
    expect(container.querySelector('.sign-off-out')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Built with by Factman',
    );
  });
});
