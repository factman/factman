import { render, screen } from '@testing-library/angular';

import { Home } from './home';

describe('Home (Testing Library smoke test)', () => {
  it('shows the site heading', async () => {
    await render(Home);
    expect(screen.getByRole('heading', { level: 1, name: 'Factman' })).toBeTruthy();
  });
});
