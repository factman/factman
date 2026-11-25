import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ANALYTICS_TRACKER } from '@shared';

import { PageHero } from './page-hero';

/** Any URL renders nothing, so clicking a link in a test navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];

const media = {
  src: '/assets/profile/odunayo-about.webp',
  alt: 'Odunayo Mohammed in a three-quarter view',
  width: 720,
  height: 900,
};

const renderHero = (inputs: Record<string, unknown> = {}) =>
  render(PageHero, {
    inputs: { title: 'Senior help for the work that matters most', ...inputs },
    providers: [provideRouter([])],
  });

describe('PageHero', () => {
  it('has the page h1, its eyebrow and lead', async () => {
    await renderHero({ eyebrow: 'Services', lead: 'Eight ways to work together.' });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Senior help for the work that matters most',
    );
    expect(screen.getByText('Services')).toBeTruthy();
    expect(screen.getByText('Eight ways to work together.')).toBeTruthy();
  });

  it('shows the breadcrumbs, with the current page last', async () => {
    await renderHero({ crumbs: [{ label: 'Home', href: '/' }, { label: 'Services' }] });
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.textContent).toContain('Home');
    expect(screen.getByText('Services').closest('[aria-current]')).toBeTruthy();
  });

  it('makes the first action primary and the rest secondary', async () => {
    const { container } = await renderHero({
      actions: [
        { label: 'Book', href: '/services' },
        { label: 'Browse', href: '#catalogue' },
      ],
    });
    const buttons = [...container.querySelectorAll('.page-hero-actions a')];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Book', 'Browse']);
    expect(buttons[0].className).toContain('primary');
    expect(buttons[1].className).toContain('secondary');
  });

  it('emits schedule from a "Schedule a call" action', async () => {
    const schedule = vi.fn();
    await render(PageHero, {
      inputs: {
        title: 'DevOps',
        actions: [{ label: 'Schedule a call', schedule: true, service: 'DevOps' }],
      },
      on: { schedule },
      providers: [provideRouter([])],
    });
    await userEvent.click(screen.getByRole('button', { name: /Schedule a call/ }));
    expect(schedule).toHaveBeenCalledWith('DevOps');
  });

  it('shows the media eagerly as the LCP image, cutout or framed', async () => {
    const { container, rerender } = await renderHero({ media });
    const img = screen.getByRole('img', { name: media.alt });
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(container.querySelector('.page-hero-media')!.classList).not.toContain('is-framed');
    await rerender({ inputs: { media: { ...media, framed: true } }, partialUpdate: true });
    expect(container.querySelector('.page-hero-media')!.classList).toContain('is-framed');
  });

  it('lists meta facts and a note', async () => {
    await renderHero({
      meta: ['4 deliverables', 'Quote per engagement'],
      note: 'Remote from Lagos',
    });
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '4 deliverables',
      'Quote per engagement',
    ]);
    expect(screen.getByText('Remote from Lagos')).toBeTruthy();
  });
});

describe('PageHero analytics (cta_click)', () => {
  it('sends cta_click from each action, its id from the label, location page_hero', async () => {
    const track = vi.fn();
    await render(PageHero, {
      inputs: {
        title: 'Services',
        actions: [
          { label: 'Browse services', href: '#catalogue' },
          { label: 'Schedule a call', schedule: true },
        ],
      },
      providers: [provideRouter(ANY_ROUTE), { provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    const link = screen.getByRole('link', { name: /Browse services/ });
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    await userEvent.click(screen.getByRole('button', { name: /Schedule a call/ }));
    expect(track.mock.calls).toEqual([
      ['cta_click', { cta_id: 'browse_services', location: 'page_hero' }],
      ['cta_click', { cta_id: 'schedule_a_call', location: 'page_hero' }],
    ]);
  });
});
