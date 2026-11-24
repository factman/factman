import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Dialog } from './dialog';

describe('Dialog', () => {
  afterEach(() => document.documentElement.classList.remove('dialog-scroll-lock'));

  it('opens as a named dialog, locks scrolling and asks to close', async () => {
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
    expect(document.documentElement.classList).toContain('dialog-scroll-lock');
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closed).toHaveBeenCalledOnce();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(closed).toHaveBeenCalledTimes(2);
    await rerender({ componentProperties: { open: false, closed } });
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.documentElement.classList).not.toContain('dialog-scroll-lock');
    expect(document.activeElement).toBe(opener);
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
});
