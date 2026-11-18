import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  it('is a toggle named "Dark theme", pressed in the dark theme', async () => {
    const { rerender } = await render(ThemeToggle, { inputs: { theme: 'light' } });
    expect(screen.getByRole('button', { name: 'Dark theme', pressed: false })).toBeTruthy();
    await rerender({ inputs: { theme: 'dark' } });
    expect(screen.getByRole('button', { name: 'Dark theme', pressed: true })).toBeTruthy();
  });

  it('asks for the other theme from the keyboard', async () => {
    const change = vi.fn();
    await render(
      `<fm-theme-toggle theme="dark" [showLabel]="true" (themeChange)="change($event)" />`,
      {
        imports: [ThemeToggle],
        componentProperties: { change },
      },
    );
    const button = screen.getByRole('button', { name: 'Dark theme' });
    expect(button.textContent).toContain('Dark theme');
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(change).toHaveBeenCalledWith('light');
  });
});
