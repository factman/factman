import { render, screen } from '@testing-library/angular';

import { AvailabilityBadge } from './availability-badge';

describe('AvailabilityBadge', () => {
  it('says available with a pulsing green dot', async () => {
    const { container } = await render(AvailabilityBadge, {
      inputs: { label: 'Available for new projects' },
    });
    const status = screen.getByText('Available for new projects');
    expect(status.classList).toContain('fm-tone--success');
    expect(status.classList).toContain('is-pulsing');
    expect(container.querySelector('.availability')).toBeTruthy();
  });

  it('says busy in amber without a pulse', async () => {
    await render(AvailabilityBadge, { inputs: { status: 'busy' } });
    const status = screen.getByText('Booked for now');
    expect(status.classList).toContain('fm-tone--warning');
    expect(status.classList).not.toContain('is-pulsing');
  });
});
