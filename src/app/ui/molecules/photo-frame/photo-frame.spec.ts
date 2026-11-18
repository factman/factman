import { render, screen } from '@testing-library/angular';

import { PhotoFrame } from './photo-frame';

const image = {
  src: '/assets/profile/odunayo-hero-360.webp',
  alt: 'Odunayo Mohammed, smiling',
  width: 360,
  height: 450,
  sources: { avif: '/assets/profile/odunayo-hero-360.avif 360w' },
};

describe('PhotoFrame', () => {
  it('frames the responsive photo with projected content', async () => {
    const { container } = await render(
      `<fm-photo-frame [image]="image" variant="note"><p>Got a project in mind?</p></fm-photo-frame>`,
      { imports: [PhotoFrame], componentProperties: { image } },
    );
    expect(screen.getByRole('figure').classList).toContain('is-note');
    expect(screen.getByRole('img', { name: image.alt }).getAttribute('loading')).toBe('lazy');
    expect(container.querySelector('source[type="image/avif"]')).toBeTruthy();
    expect(screen.getByText('Got a project in mind?').closest('.photo-frame-over')).toBeTruthy();
  });

  it('loads at once as the main image', async () => {
    await render(PhotoFrame, { inputs: { image, priority: true } });
    expect(screen.getByRole('img').getAttribute('loading')).toBe('eager');
  });
});
