import { render, screen } from '@testing-library/angular';

import { iconCode } from '../icon/icons';
import { Tag } from './tag';

describe('Tag', () => {
  it('renders its text with the tone, size and variant classes', async () => {
    await render(`<fm-tag tone="success" size="lg" variant="outline">Live</fm-tag>`, {
      imports: [Tag],
    });
    const tag = screen.getByText('Live');
    expect([...tag.classList].sort()).toEqual([
      'fm-tag',
      'fm-tag--lg',
      'fm-tag--outline',
      'fm-tone--success',
    ]);
  });

  it('adds a decorative dot and icon', async () => {
    const { container } = await render(
      `<fm-tag [dot]="true" [leadingIcon]="icon">Angular</fm-tag>`,
      { imports: [Tag], componentProperties: { icon: iconCode } },
    );
    expect(container.querySelector('.fm-tag__dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('Angular')).toBeTruthy();
  });
});
