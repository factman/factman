import { render, screen } from '@testing-library/angular';

import { AvatarLabel } from './avatar-label';

describe('AvatarLabel', () => {
  it('shows the name and description, with the avatar hidden from screen readers', async () => {
    const { container } = await render(AvatarLabel, {
      inputs: { title: 'Odunayo Mohammed', description: 'CTO, Simple Finance' },
    });
    expect(screen.getByText('Odunayo Mohammed')).toBeTruthy();
    expect(screen.getByText('CTO, Simple Finance')).toBeTruthy();
    expect(container.querySelector('fm-avatar')?.parentElement?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(screen.queryByRole('img')).toBeNull();
  });
});
