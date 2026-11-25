import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { CareerGlance } from './career-glance';

describe('CareerGlance', () => {
  it('lists current roles, stats and "Get the résumé", which asks the page to open it', async () => {
    const openResume = vi.fn();
    await render(CareerGlance, {
      inputs: {
        roles: [
          { title: 'Chief Technology Officer', description: 'Simple Finance · since Jan 2024' },
          { title: 'CTO & Co-Founder', description: 'ETeam Technology · since May 2017' },
        ],
        stats: [
          { value: 12, suffix: '+', label: 'years since 2013' },
          { value: 10, label: 'organizations' },
        ],
      },
      on: { openResume },
      providers: [provideRouter([])],
    });
    expect(screen.getByRole('complementary', { name: 'At a glance' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Current roles' }).querySelectorAll('li')).toHaveLength(
      2,
    );
    expect(screen.getByText('12+ years since 2013')).toBeTruthy();
    // A button that opens the résumé preview, not a link that scrolls to the section.
    expect(screen.queryByRole('link', { name: /Get the résumé/ })).toBeNull();
    const button = screen.getByRole('button', { name: /Get the résumé/ });
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    await userEvent.click(button);
    expect(openResume).toHaveBeenCalledTimes(1);
  });
});
