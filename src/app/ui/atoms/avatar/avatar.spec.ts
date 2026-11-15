import { fireEvent, render, screen } from '@testing-library/angular';

import { Avatar, initialsOf } from './avatar';

describe('initialsOf', () => {
  it('takes the first letters of the first two words', () => {
    expect(initialsOf('Odunayo Mohammed')).toBe('OM');
    expect(initialsOf('  ada  lovelace byron ')).toBe('AL');
    expect(initialsOf('Cher')).toBe('C');
    expect(initialsOf('')).toBe('');
  });
});

describe('Avatar', () => {
  it('shows the photo with the name as alt text', async () => {
    await render(Avatar, {
      inputs: {
        name: 'Odunayo Mohammed',
        src: '/assets/profile/odunayo-hero-360.webp',
        size: 'lg',
      },
    });
    const img = screen.getByRole('img', { name: 'Odunayo Mohammed' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('width')).toBe('48');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.closest('.fm-avatar')?.getAttribute('style')).toContain('width: 48px');
  });

  it('shows the initials, named for assistive tech, without a photo', async () => {
    const { container } = await render(Avatar, { inputs: { name: 'Odunayo Mohammed' } });
    const avatar = screen.getByRole('img', { name: 'Odunayo Mohammed' });
    expect(avatar.classList).toContain('fm-avatar');
    const initials = container.querySelector('.fm-avatar__initials') as HTMLElement;
    expect(initials.textContent).toBe('OM');
    expect(initials.getAttribute('aria-hidden')).toBe('true');
    // md is 40px; initials are 36% of it.
    expect(avatar.style.fontSize).toBe('14px');
  });

  it('falls back to the initials when the photo fails to load', async () => {
    const { container } = await render(Avatar, {
      inputs: { name: 'Ada Lovelace', src: '/missing.webp' },
    });
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Ada Lovelace' }).textContent?.trim()).toBe('AL');
  });

  it('tries a new photo again after a failure', async () => {
    const { container, rerender } = await render(Avatar, {
      inputs: { name: 'Ada Lovelace', src: '/missing.webp' },
    });
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    await rerender({ inputs: { name: 'Ada Lovelace', src: '/ada.webp' }, partialUpdate: true });
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/ada.webp');
  });

  it('loads eagerly and squares off when asked', async () => {
    const { container } = await render(Avatar, {
      inputs: { name: 'A B', src: '/a.webp', eager: true, shape: 'square' },
    });
    expect(container.querySelector('img')?.getAttribute('loading')).toBeNull();
    expect(container.querySelector('.fm-avatar')?.classList).toContain('fm-avatar--square');
  });
});
