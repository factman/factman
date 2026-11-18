import { render, screen } from '@testing-library/angular';

import { Divider } from './divider';

describe('Divider', () => {
  it('is a decorative horizontal line by default', async () => {
    const { container } = await render(Divider);
    const line = container.querySelector('.fm-divider--h') as HTMLElement;
    expect(line.getAttribute('aria-hidden')).toBe('true');
  });

  it('can be vertical and strong', async () => {
    const { container } = await render(Divider, {
      inputs: { orientation: 'vertical', strong: true },
    });
    const line = container.querySelector('div') as HTMLElement;
    expect([...line.classList].sort()).toEqual(['fm-divider--strong', 'fm-divider--v']);
  });

  it('shows a readable label with decorative lines', async () => {
    const { container } = await render(Divider, { inputs: { label: 'or', align: 'start' } });
    expect(screen.getByText('or')).toBeTruthy();
    const wrap = container.querySelector('.fm-divider--label') as HTMLElement;
    expect(wrap.classList).toContain('fm-divider--start');
    expect(wrap.getAttribute('aria-hidden')).toBeNull();
    expect(wrap.querySelectorAll('.fm-divider__line[aria-hidden="true"]')).toHaveLength(2);
  });
});
