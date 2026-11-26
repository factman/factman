import { PLATFORM_ID } from '@angular/core';
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

describe('Image preload (ETE-126)', () => {
  const preloads = () => [...document.head.querySelectorAll('link[rel="preload"][as="image"]')];
  afterEach(() => preloads().forEach((l) => l.remove()));

  const renderOn = (platform: string, priority: boolean) =>
    render(Image, {
      inputs: {
        src: '/hero.webp',
        alt: 'Hero',
        width: 720,
        height: 900,
        priority,
        sources: { avif: '/hero-360.avif 360w, /hero-720.avif 720w', webp: '/hero-720.webp 720w' },
        sizes: '(min-width: 768px) 360px, 100vw',
      },
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });

  it('preloads a priority image from the <head> when prerendering, in its best format', async () => {
    await renderOn('server', true);
    const [link] = preloads();
    expect(link.getAttribute('href')).toBe('/hero.webp');
    expect(link.getAttribute('type')).toBe('image/avif');
    expect(link.getAttribute('imagesrcset')).toBe('/hero-360.avif 360w, /hero-720.avif 720w');
    expect(link.getAttribute('imagesizes')).toBe('(min-width: 768px) 360px, 100vw');
    expect(link.getAttribute('fetchpriority')).toBe('high');
    expect(preloads()).toHaveLength(1);
  });

  it('adds nothing in the browser, or for an image without priority', async () => {
    await renderOn('browser', true);
    expect(preloads()).toHaveLength(0);
  });

  it('adds nothing for a lazy image', async () => {
    await renderOn('server', false);
    expect(preloads()).toHaveLength(0);
  });
});
