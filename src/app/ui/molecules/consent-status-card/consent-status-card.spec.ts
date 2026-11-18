import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ConsentStatusCard } from './consent-status-card';

describe('ConsentStatusCard', () => {
  it('prints the analytics choice and asks to change it', async () => {
    const change = vi.fn();
    const { rerender } = await render(
      `<fm-consent-status-card [analytics]="analytics" (changeSettings)="change()" />`,
      { imports: [ConsentStatusCard], componentProperties: { analytics: 'unset', change } },
    );
    expect(screen.getByText(/analytics\s+not decided/)).toBeTruthy();
    expect(screen.getByText(/advertising off \(never used\)/)).toBeTruthy();
    await rerender({ componentProperties: { analytics: 'granted', change } });
    expect(screen.getByText(/analytics\s+on/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Change cookie settings' }));
    expect(change).toHaveBeenCalledOnce();
  });
});
