import { portraitSources, portraitWidths } from './portrait-sources';

describe('portraitSources', () => {
  it('exports half, three-quarters and full width, in even pixels', () => {
    expect(portraitWidths(720)).toEqual([360, 540, 720]);
    expect(portraitWidths(900)).toEqual([450, 676, 900]);
  });

  it('builds AVIF and WebP srcsets under /assets, and keeps the source as the fallback', () => {
    const photo = {
      src: 'profile/odunayo-thinking.webp',
      alt: 'Thinking',
      width: 720,
      height: 900,
    };
    expect(portraitSources(photo)).toEqual({
      ...photo,
      src: '/assets/profile/odunayo-thinking.webp',
      sources: {
        avif: '/assets/profile/odunayo-thinking-360.avif 360w, /assets/profile/odunayo-thinking-540.avif 540w, /assets/profile/odunayo-thinking-720.avif 720w',
        webp: '/assets/profile/odunayo-thinking-360.webp 360w, /assets/profile/odunayo-thinking-540.webp 540w, /assets/profile/odunayo-thinking-720.webp 720w',
      },
    });
  });
});
