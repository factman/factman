import { render, screen } from '@testing-library/angular';

import { Image } from './image';

const base = { src: '/assets/a-720.jpg', alt: 'Portrait', width: 360, height: 450 };

describe('Image', () => {
  it('offers AVIF then WebP, with a sized lazy fallback', async () => {
    const { container } = await render(Image, {
      inputs: {
        ...base,
        sources: { avif: '/a-360.avif 360w, /a-720.avif 720w', webp: '/a-360.webp 360w' },
        sizes: '360px',
      },
    });
    const types = [...container.querySelectorAll('source')].map((s) => s.getAttribute('type'));
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(container.querySelector('source')?.getAttribute('sizes')).toBe('360px');
    const img = screen.getByRole('img', { name: 'Portrait' }) as HTMLImageElement;
    expect(img.getAttribute('width')).toBe('360');
    expect(img.getAttribute('height')).toBe('450');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('fetchpriority')).toBeNull();
  });

  it('loads at once with high priority when it is the main image', async () => {
    await render(Image, { inputs: { ...base, priority: true } });
    const img = screen.getByRole('img', { name: 'Portrait' });
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });
});
