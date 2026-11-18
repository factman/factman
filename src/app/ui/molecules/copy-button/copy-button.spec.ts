import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { copyText } from './clipboard';
import { COPIED_FOR, CopyButton } from './copy-button';

/** jsdom has no Clipboard API; tests give it one (or none). */
function setClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
}

describe('copyText', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses the Clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const doc = { defaultView: { navigator: { clipboard: { writeText } } } } as unknown as Document;
    expect(await copyText('a@b.c', doc)).toBe(true);
    expect(writeText).toHaveBeenCalledWith('a@b.c');
  });

  it('falls back to a hidden text area', async () => {
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });
    setClipboard(undefined);
    expect(await copyText('a@b.c', document)).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });
});

describe('CopyButton', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('copies, says so politely, then resets', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const copied = vi.fn();
    const { fixture } = await render(
      `<fm-copy-button value="hello@example.com" label="Copy email" (copied)="copied($event)" />`,
      { imports: [CopyButton], componentProperties: { copied } },
    );
    await user.click(screen.getByRole('button', { name: 'Copy email' }));
    expect(writeText).toHaveBeenCalledWith('hello@example.com');
    expect(copied).toHaveBeenCalledWith('hello@example.com');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'Copied hello@example.com to the clipboard',
    );
    vi.advanceTimersByTime(COPIED_FOR);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Copy email' })).toBeTruthy();
  });

  it('tells the visitor when copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    setClipboard({ writeText });
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true });
    const copied = vi.fn();
    await render(`<fm-copy-button value="+234 706" (copied)="copied()" />`, {
      imports: [CopyButton],
      componentProperties: { copied },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByText("Couldn't copy. Select +234 706 and copy it.")).toBeTruthy();
    expect(copied).not.toHaveBeenCalled();
  });
});
