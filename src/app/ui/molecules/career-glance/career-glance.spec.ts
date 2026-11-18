import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';

import { CareerGlance } from './career-glance';

describe('CareerGlance', () => {
  it('lists current roles, stats and the résumé link', async () => {
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
        resumeHref: '#resume',
      },
      providers: [provideRouter([])],
    });
    expect(screen.getByRole('complementary', { name: 'At a glance' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Current roles' }).querySelectorAll('li')).toHaveLength(
      2,
    );
    expect(screen.getByText('12+ years since 2013')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Get the résumé/ }).getAttribute('href')).toMatch(
      /#resume$/,
    );
  });
});
