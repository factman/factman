import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { Tooltip, tooltipPosition } from './tooltip';

const target = { top: 100, left: 100, width: 40, height: 20 };
const panel = { width: 80, height: 30 };

describe('tooltipPosition', () => {
  it('places the tooltip on each side with an 8px gap', () => {
    expect(tooltipPosition(target, panel, 'top', 800, 600)).toEqual({ top: 62, left: 80 });
    expect(tooltipPosition(target, panel, 'bottom', 800, 600)).toEqual({ top: 128, left: 80 });
    expect(tooltipPosition(target, panel, 'left', 800, 600)).toEqual({ top: 95, left: 12 });
    expect(tooltipPosition(target, panel, 'right', 800, 600)).toEqual({ top: 95, left: 148 });
  });

  it('keeps the tooltip inside the viewport', () => {
    const corner = { top: 2, left: 2, width: 20, height: 20 };
    expect(tooltipPosition(corner, panel, 'top', 800, 600)).toEqual({ top: 8, left: 8 });
    const right = { top: 300, left: 790, width: 10, height: 10 };
    expect(tooltipPosition(right, panel, 'right', 800, 600).left).toBe(712);
  });
});

describe('Tooltip', () => {
  const setup = () =>
    render(`<button fmTooltip="Copy email" aria-describedby="hint">Copy</button>`, {
      imports: [Tooltip],
    });

  it('describes its element and opens on keyboard focus', async () => {
    await setup();
    const button = screen.getByRole('button', { name: 'Copy' });
    const tip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tip.hidden).toBe(true);
    expect(button.getAttribute('aria-describedby')).toBe(`hint ${tip.id}`);
    await userEvent.tab();
    expect(screen.getByRole('tooltip').textContent).toContain('Copy email');
    await userEvent.tab();
    expect(tip.hidden).toBe(true);
  });

  it('opens on hover and closes on Escape', async () => {
    await setup();
    await userEvent.hover(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
