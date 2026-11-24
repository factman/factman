import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Toast } from './toast';

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('announces its text through a status region, and has a close button', async () => {
    const closed = vi.fn();
    await render(
      `<fm-toast title="Email copied" description="Paste it anywhere" [duration]="0" (closed)="closed()" />`,
      { imports: [Toast], componentProperties: { closed } },
    );
    // The region is in the page first; the text arrives after render, so it is announced.
    expect(screen.getByRole('status').textContent).toBe('Email copied. Paste it anywhere');
    const toast = document.querySelector('.fm-toast') as HTMLElement;
    expect(toast.hidden).toBe(false);
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
    const toast = document.querySelector('.fm-toast') as HTMLElement;
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

  it('waits for an open modal dialog to close before it shows', async () => {
    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    // jsdom has no :modal; stand in for the open dialog and pass every other query through.
    const real = document.querySelector.bind(document);
    const query = vi
      .spyOn(document, 'querySelector')
      .mockImplementation((selector: string) =>
        selector === 'dialog:modal' ? dialog : real(selector),
      );
    await render(`<fm-toast title="Saved" [duration]="0" />`, { imports: [Toast] });
    query.mockRestore();
    const toast = document.querySelector('.fm-toast') as HTMLElement;
    expect(toast.hidden).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('');
    dialog.dispatchEvent(new Event('close'));
    await vi.waitFor(() => expect(toast.hidden).toBe(false));
    expect(screen.getByRole('status').textContent).toBe('Saved');
    dialog.remove();
  });
});
