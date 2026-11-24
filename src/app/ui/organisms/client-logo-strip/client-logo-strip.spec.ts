import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ClientLogoStrip, loopItems, MIN_LOOP, type StripClient } from './client-logo-strip';

const clients: StripClient[] = [
  {
    id: 1,
    name: 'Simple Finance',
    logo: 'clients/simple-finance.png',
    plate: 'light',
    ratio: 3.6,
    website: 'https://simplefinance.ng',
  },
  { id: 2, name: 'Mazadat', logo: 'clients/mazadat.svg', plate: 'dark', ratio: 4.45 },
];

const renderStrip = (list: readonly StripClient[]) =>
  render(ClientLogoStrip, { inputs: { clients: list } });

describe('loopItems', () => {
  it('repeats a short list until the loop has MIN_LOOP logos, marking the repeats', () => {
    const items = loopItems(clients);
    expect(items.length).toBeGreaterThanOrEqual(MIN_LOOP);
    expect(items.slice(0, 2).map((i) => i.repeat)).toEqual([false, false]);
    expect(items.slice(2).every((i) => i.repeat)).toBe(true);
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
  });

  it('keeps a long list as it is', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ ...clients[0], id: i + 1 }));
    expect(loopItems(many)).toHaveLength(20);
    expect(loopItems([])).toEqual([]);
  });
});

describe('ClientLogoStrip', () => {
  it('renders nothing with no clients', async () => {
    const { container } = await renderStrip([]);
    expect(container.querySelector('section')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('lists each client once for assistive technology, in the order given', async () => {
    await renderStrip(clients);
    const region = screen.getByRole('region', { name: 'Worked with' });
    const items = within(region).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items.map((li) => within(li).getByRole('img').getAttribute('alt'))).toEqual([
      'Simple Finance',
      'Mazadat',
    ]);
  });

  it('opens client sites safely in a new tab, and focuses each one once', async () => {
    const { container } = await renderStrip(clients);
    const link = screen.getByRole('link', { name: /Simple Finance/ });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    const copy = container.querySelector('.client-logo-strip-group.is-copy')!;
    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.hasAttribute('inert')).toBe(true);
    // Short lists repeat to fill the loop; the repeats are hidden and inert too.
    const repeats = container.querySelectorAll('.client-logo-strip-group:not(.is-copy) .is-repeat');
    expect(repeats.length).toBeGreaterThan(0);
    for (const li of repeats) {
      expect(li.getAttribute('aria-hidden')).toBe('true');
      expect(li.hasAttribute('inert')).toBe(true);
    }
  });

  it('pauses and plays with its button', async () => {
    const { container } = await renderStrip(clients);
    const section = container.querySelector('section')!;
    await userEvent.click(screen.getByRole('button', { name: 'Pause the logo animation' }));
    expect(section.classList).toContain('is-paused');
    const play = screen.getByRole('button', { name: 'Play the logo animation' });
    expect(play.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(play);
    expect(section.classList).not.toContain('is-paused');
  });
});
