import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { CtaBanner } from './cta-banner';

describe('CtaBanner', () => {
  it('has a heading, text and the actions, the first primary', async () => {
    const { container } = await render(CtaBanner, {
      inputs: {
        title: 'Not sure which service fits?',
        text: "Tell me what you're building.",
        actions: [
          { label: 'Schedule a call', href: 'https://calendar.example.com' },
          { label: 'Email me', href: 'mailto:hello@example.com' },
        ],
      },
      providers: [provideRouter([])],
    });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Not sure which service fits?' }),
    ).toBeTruthy();
    expect(screen.getByText("Tell me what you're building.")).toBeTruthy();
    const links = [...container.querySelectorAll('.cta-banner-actions a')];
    expect(links.map((a) => a.textContent?.trim())).toEqual(
      expect.arrayContaining([expect.stringContaining('Schedule a call'), 'Email me']),
    );
    expect(links[0].className).toContain('primary');
  });

  it('shows a decorative photo when given', async () => {
    const { container } = await render(CtaBanner, {
      inputs: {
        title: 'Building something similar?',
        photo: { src: '/a.webp', alt: 'ignored', width: 720, height: 900 },
      },
      providers: [provideRouter([])],
    });
    expect(container.querySelector('.cta-banner')!.classList).toContain('has-photo');
    expect(container.querySelector('.cta-banner-photo img')!.getAttribute('alt')).toBe('');
  });
});
