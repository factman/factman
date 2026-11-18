import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { WindowFrame } from './window-frame';

describe('WindowFrame', () => {
  it('shows the bar, decorative tabs and the content', async () => {
    const { container } = await render(
      `<fm-window-frame title="hero.ts" [tabs]="tabs"><p>Body</p></fm-window-frame>`,
      {
        imports: [WindowFrame],
        componentProperties: { tabs: [{ label: 'hero.ts', active: true }, { label: 'cv.ts' }] },
      },
    );
    expect(container.querySelector('.fm-window__dots')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.fm-window__tabs')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.fm-etab.is-active')?.textContent).toBe('hero.ts');
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a terminal with a close button when asked', async () => {
    const closed = vi.fn();
    const { container } = await render(
      `<fm-window-frame variant="terminal" title="zsh" [closable]="true" (closed)="closed()" />`,
      { imports: [WindowFrame], componentProperties: { closed } },
    );
    expect(container.querySelector('.fm-window')?.classList).toContain('fm-window--terminal');
    await userEvent.click(screen.getByRole('button', { name: 'Close zsh' }));
    expect(closed).toHaveBeenCalledOnce();
  });
});
