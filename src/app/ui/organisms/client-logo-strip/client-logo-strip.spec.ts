import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ClientLogoStrip, type StripClient } from './client-logo-strip';

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
    expect(copy.querySelector('a')!.getAttribute('tabindex')).toBe('-1');
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
