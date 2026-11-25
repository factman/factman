import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ANALYTICS_TRACKER } from '@shared';

import { CtaBanner } from './cta-banner';

/** Any URL renders nothing, so clicking a link in a test navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];

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

describe('CtaBanner analytics (cta_click)', () => {
  it('sends cta_click from its actions with location cta_banner', async () => {
    const track = vi.fn();
    await render(CtaBanner, {
      inputs: {
        title: 'Building something similar?',
        actions: [{ label: 'Book a service', href: '/services' }],
      },
      providers: [provideRouter(ANY_ROUTE), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    const link = screen.getByRole('link', { name: /Book a service/ });
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    expect(track).toHaveBeenCalledWith('cta_click', {
      cta_id: 'book_a_service',
      location: 'cta_banner',
    });
  });
});
