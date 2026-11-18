import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Chip } from './chip';

describe('Chip', () => {
  it('is static text without `selected`', async () => {
    await render(`<fm-chip>Fintech</fm-chip>`, { imports: [Chip] });
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Fintech').closest('.fm-chip')).toBeTruthy();
  });

  it('is a toggle button that asks to flip its state', async () => {
    const toggled = vi.fn();
    await render(
      `<fm-chip [selected]="false" value="web" (toggled)="toggled($event)">Web</fm-chip>`,
      { imports: [Chip], componentProperties: { toggled } },
    );
    const button = screen.getByRole('button', { name: 'Web', pressed: false });
    await userEvent.click(button);
    expect(toggled).toHaveBeenCalledWith({ value: 'web', selected: true });
  });

  it('shows the selected state', async () => {
    await render(`<fm-chip [selected]="true">Web</fm-chip>`, { imports: [Chip] });
    const button = screen.getByRole('button', { name: 'Web', pressed: true });
    expect(button.parentElement?.classList).toContain('is-selected');
  });

  it('does nothing while disabled', async () => {
    const toggled = vi.fn();
    await render(
      `<fm-chip [selected]="false" [disabled]="true" (toggled)="toggled($event)">Web</fm-chip>`,
      { imports: [Chip], componentProperties: { toggled } },
    );
    const button = screen.getByRole('button', { name: 'Web' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(button);
    expect(toggled).not.toHaveBeenCalled();
  });
});
