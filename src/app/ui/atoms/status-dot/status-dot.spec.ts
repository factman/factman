import { render, screen } from '@testing-library/angular';

import { StatusDot } from './status-dot';

describe('StatusDot', () => {
  it('pairs the dot with visible words', async () => {
    const { container } = await render(StatusDot, {
      inputs: { label: 'Available', tone: 'success' },
    });
    const status = screen.getByText('Available');
    expect([...status.classList].sort()).toEqual(['fm-status', 'fm-tone--success']);
    expect(container.querySelector('.fm-status-dot')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('pulses only when asked', async () => {
    const { rerender } = await render(StatusDot, { inputs: { label: 'Live' } });
    expect(screen.getByText('Live').classList).not.toContain('is-pulsing');
    await rerender({ inputs: { label: 'Live', pulse: true } });
    expect(screen.getByText('Live').classList).toContain('is-pulsing');
  });
});
