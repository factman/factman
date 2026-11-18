import { render, screen } from '@testing-library/angular';

import { Badge, badgeText } from './badge';

describe('badgeText', () => {
  it('caps the count at max', () => {
    expect(badgeText(3, 99)).toBe('3');
    expect(badgeText(99, 99)).toBe('99');
    expect(badgeText(120, 99)).toBe('99+');
  });
});

describe('Badge', () => {
  it('shows the count and reads the label instead', async () => {
    const { container } = await render(Badge, { inputs: { count: 3, label: '3 unread messages' } });
    const badge = container.querySelector('.fm-badge') as HTMLElement;
    expect(badge.querySelector('[aria-hidden="true"]')?.textContent).toBe('3');
    expect(screen.getByText('3 unread messages').classList).toContain('fm-sr');
  });

  it('is a dot without a count', async () => {
    const { container } = await render(Badge, { inputs: { tone: 'success', size: 'md' } });
    const classes = [...(container.querySelector('.fm-badge') as HTMLElement).classList].sort();
    expect(classes).toEqual(['fm-badge', 'fm-badge--dot', 'fm-badge--md', 'fm-badge--success']);
  });

  it('uses the solid danger tokens by default, for contrast', async () => {
    const { container } = await render(Badge, { inputs: { count: 1 } });
    expect(container.querySelector('.fm-badge')?.classList).toContain('fm-badge-danger');
  });
});
