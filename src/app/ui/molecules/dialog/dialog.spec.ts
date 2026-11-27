import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Dialog } from './dialog';

describe('Dialog', () => {
  it('opens as a named dialog, light-dismissable, and asks to close', async () => {
    const closed = vi.fn();
    const { rerender } = await render(
      `<button>Preview résumé</button>
       <fm-dialog [open]="open" label="Web résumé" description="Two pages, PDF" (closed)="closed()">
         <p>Body</p><div dialogFooter><button>Download</button></div>
       </fm-dialog>`,
      { imports: [Dialog], componentProperties: { open: false, closed } },
    );
    const opener = screen.getByRole('button', { name: 'Preview résumé' });
    opener.focus();
    await rerender({ componentProperties: { open: true, closed } });
    const dialog = screen.getByRole('dialog', { name: 'Web résumé' });
    expect(dialog.hasAttribute('open')).toBe(true);
    // Light dismiss is declarative; the page's root overflow is never touched (ETE-252).
    expect(dialog.getAttribute('closedby')).toBe('any');
    expect(document.documentElement.style.overflow).toBe('');
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closed).toHaveBeenCalledOnce();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(closed).toHaveBeenCalledTimes(2);
    await rerender({ componentProperties: { open: false, closed } });
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('tells the parent when the browser closes it itself, and not when the parent did', async () => {
    const closed = vi.fn();
    const { rerender } = await render(
      `<fm-dialog [open]="open" label="Terminal" (closed)="closed()"><p>Body</p></fm-dialog>`,
      { imports: [Dialog], componentProperties: { open: true, closed } },
    );
    const dialog = screen.getByRole('dialog', { name: 'Terminal' });
    dialog.dispatchEvent(new Event('close'));
    expect(closed).toHaveBeenCalledOnce();
    await rerender({ componentProperties: { open: false, closed } });
    dialog.dispatchEvent(new Event('close'));
    expect(closed).toHaveBeenCalledOnce();
  });

  it('bare: shows only the projected panel, named by its label', async () => {
    await render(
      `<fm-dialog [open]="true" [bare]="true" label="Fullstack résumé preview">
         <div dialogBare><p>Window</p></div><p>Not shown</p>
       </fm-dialog>`,
      { imports: [Dialog] },
    );
    const dialog = screen.getByRole('dialog', { name: 'Fullstack résumé preview' });
    expect(dialog.classList).toContain('is-bare');
    expect(dialog.textContent).toContain('Window');
    expect(dialog.textContent).not.toContain('Not shown');
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(dialog.querySelector('h2')).toBeNull();
  });
  it('makes its body a named tab stop only while it scrolls (ETE-127)', async () => {
    // jsdom has no layout: report a body taller than its box, and run observers at once.
    let overflow = true;
    const callbacks: (() => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          callbacks.push(cb);
          cb();
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    const height = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockImplementation(() => (overflow ? 800 : 100));
    const client = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
    const { fixture } = await render(
      `<fm-dialog [open]="true" label="Schedule a call"><p>Calendar</p></fm-dialog>`,
      { imports: [Dialog] },
    );
    fixture.detectChanges();
    const body = screen.getByRole('region', { name: 'Schedule a call' });
    expect(body.getAttribute('tabindex')).toBe('0');

    overflow = false;
    callbacks.forEach((cb) => cb());
    fixture.detectChanges();
    expect(screen.queryByRole('region')).toBeNull();
    expect(document.querySelector('.fm-modal__body')!.hasAttribute('tabindex')).toBe(false);
    height.mockRestore();
    client.mockRestore();
    vi.unstubAllGlobals();
  });
});
