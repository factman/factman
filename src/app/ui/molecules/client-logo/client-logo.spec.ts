import { render, screen } from '@testing-library/angular';

import { ClientLogo, LOGO_HEIGHT } from './client-logo';

const client = {
  name: 'Simple Finance',
  logo: 'clients/simple-finance.png',
  plate: 'light' as const,
  ratio: 3.596,
  website: 'https://simplefinance.ng',
};

describe('ClientLogo', () => {
  it('links the named logo to the website in a new tab, sized by ratio', async () => {
    await render(ClientLogo, { inputs: { client } });
    const link = screen.getByRole('link', { name: /Simple Finance.*opens in a new tab/ });
    expect(link.getAttribute('href')).toBe('https://simplefinance.ng');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    const img = screen.getByRole('img', { name: 'Simple Finance' });
    expect(img.getAttribute('src')).toBe('/assets/clients/simple-finance.png');
    expect(img.getAttribute('height')).toBe(String(LOGO_HEIGHT));
    expect(img.getAttribute('width')).toBe('115');
  });

  it('is not a link without a website, and uses the dark plate for white artwork', async () => {
    const { container } = await render(ClientLogo, {
      inputs: { client: { ...client, website: undefined, plate: 'dark' } },
    });
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('.client-logo-plate')?.classList).toContain('is-dark');
  });

  it('names it once when the name is shown', async () => {
    await render(ClientLogo, { inputs: { client, showName: true } });
    expect(
      screen.getByRole('link', { name: /^Simple Finance\s*\(opens in a new tab\)$/ }),
    ).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Simple Finance' })).toBeNull();
  });
});
