import { render, screen } from '@testing-library/angular';

import { Logo } from './logo';

describe('Logo', () => {
  it('renders the ODUNAYO lockup by default, named once for assistive tech', async () => {
    const { container } = await render(Logo);
    const logo = screen.getByRole('img', { name: 'Odunayo' });
    expect(logo.classList).toContain('fm-logo');
    expect(logo.classList).toContain('fm-logo--lockup');
    expect(logo.classList).toContain('fm-logo--light');
    expect(logo.textContent?.trim()).toBe('ODUNAYO');
    const mark = container.querySelector('img.fm-logo__mark') as HTMLImageElement;
    expect(mark.getAttribute('alt')).toBe('');
    expect(mark.getAttribute('src')).toBe('/assets/brand/ay-mark-light-256.webp');
    expect(logo.style.getPropertyValue('--fm-logo-size')).toBe('48px');
  });

  it('renders the mark alone with its own alt text', async () => {
    await render(Logo, { inputs: { type: 'mark', size: 36 } });
    const mark = screen.getByRole('img', { name: 'Odunayo Mohammed' }) as HTMLImageElement;
    expect(mark.getAttribute('width')).toBe('36');
    expect(mark.getAttribute('srcset')).toBe(
      '/assets/brand/ay-mark-light-128.webp 128w, /assets/brand/ay-mark-light-256.webp 256w',
    );
  });

  it('uses the dark artwork on dark grounds', async () => {
    const { container } = await render(Logo, { inputs: { theme: 'dark' } });
    expect(container.querySelector('.fm-logo')?.classList).toContain('fm-logo--dark');
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/assets/brand/ay-mark-dark-256.webp',
    );
  });

  it('renders the lockup from its artwork when asked, at the artwork ratio', async () => {
    await render(Logo, { inputs: { artwork: true, size: 96, theme: 'dark' } });
    const art = screen.getByRole('img', { name: 'Odunayo' }) as HTMLImageElement;
    expect(art.classList).toContain('fm-logo--art');
    expect(art.getAttribute('src')).toBe('/assets/brand/odunayo-lockup-dark-192.webp');
    expect(art.getAttribute('width')).toBe('314');
    expect(art.getAttribute('height')).toBe('96');
  });

  it('accepts a custom accessible name', async () => {
    await render(Logo, { inputs: { alt: 'Odunayo Mohammed, home' } });
    expect(screen.getByRole('img', { name: 'Odunayo Mohammed, home' })).toBeTruthy();
  });
});
