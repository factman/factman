import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ProjectsPage } from './projects';

describe('ProjectsPage (/projects)', () => {
  it('shows every project, the filters and the closing banner', async () => {
    const { container } = await render(ProjectsPage, { providers: [provideRouter([])] });
    const { projects } = await import('@data/projects');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Everything I have built and shipped' }),
    ).toBeTruthy();
    expect(container.querySelectorAll('.project-gallery-list > li')).toHaveLength(projects.length);
    expect(screen.getByText(`${projects.length} of ${projects.length} projects`)).toBeTruthy();
    expect(screen.getByText('Building something similar?')).toBeTruthy();
  });

  it('keeps the filter in the URL query', async () => {
    const { fixture } = await render(ProjectsPage, {
      providers: [provideRouter([{ path: '**', component: ProjectsPage }])],
    });
    const router = fixture.debugElement.injector.get(Router);
    await userEvent.click(screen.getByRole('button', { name: /Archived/ }));
    await fixture.whenStable();
    expect(router.url).toContain('status=archived');
  });
});
