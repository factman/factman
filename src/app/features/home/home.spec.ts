import { render, screen } from '@testing-library/angular';

import { Home } from './home';

describe('Home (Testing Library smoke test)', () => {
  it('shows the site heading', async () => {
    await render(Home);
    expect(screen.getByRole('heading', { level: 1, name: 'Odunayo Mohammed' })).toBeTruthy();
  });
});

describe('Home sections', () => {
  it('has an anchor for every home link in the site navigation', async () => {
    const { site } = await import('@data/site');
    const { HOME_SECTIONS } = await import('./home-sections');
    const ids = HOME_SECTIONS.map((s) => s.id) as string[];
    for (const item of site.nav) expect(ids).toContain(item.anchor.replace('#', ''));
  });
});
