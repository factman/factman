import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Toast } from './toast';

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('is a status with a close button', async () => {
    const closed = vi.fn();
    await render(
      `<fm-toast title="Email copied" description="Paste it anywhere" [duration]="0" (closed)="closed()" />`,
      { imports: [Toast], componentProperties: { closed } },
    );
    const toast = screen.getByRole('status');
    expect(toast.classList).toContain('fm-toast--dark');
    expect(toast.textContent).toContain('Paste it anywhere');
    expect(toast.querySelector('.fm-toast__timer')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closed).toHaveBeenCalledOnce();
  });

  it('closes itself after its duration, pausing while hovered', async () => {
    vi.useFakeTimers();
    const closed = vi.fn();
    await render(`<fm-toast title="Saved" [duration]="1000" (closed)="closed()" />`, {
      imports: [Toast],
      componentProperties: { closed },
    });
    const toast = screen.getByRole('status');
    await vi.advanceTimersByTimeAsync(600);
    toast.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(closed).not.toHaveBeenCalled();
    toast.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.advanceTimersByTimeAsync(399);
    expect(closed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(closed).toHaveBeenCalledOnce();
  });
});
