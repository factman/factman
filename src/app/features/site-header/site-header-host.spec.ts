import { importProvidersFrom } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { CoreModule } from '@core';
import { ThemeService } from '@core/theme';
import { ResumeLauncher } from '@shared';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

/** Any URL renders nothing, so following a link navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];
const providers = [
  provideRouter(ANY_ROUTE),
  importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
];

import { SiteHeaderHost } from './site-header-host';

afterEach(() => localStorage.clear());

describe('SiteHeaderHost', () => {
  it('shows the site navigation and marks the current page', async () => {
    const { fixture } = await render(SiteHeaderHost, { providers });
    const router = fixture.debugElement.injector.get(Router);
    await router.navigateByUrl('/projects/covid-daily-update');
    fixture.detectChanges();
    const nav = within(screen.getByRole('navigation', { name: 'Primary' }));
    expect(nav.getByRole('link', { name: 'Projects' }).getAttribute('aria-current')).toBe('page');
    expect(nav.getByRole('link', { name: 'Services' }).getAttribute('href')).toBe('/services');
  });

  it('toggles the theme through ThemeService', async () => {
    const { fixture } = await render(SiteHeaderHost, { providers });
    const themes = fixture.debugElement.injector.get(ThemeService);
    const before = themes.theme();
    await userEvent.click(screen.getAllByRole('button', { name: 'Dark theme' })[0]);
    expect(themes.theme()).not.toBe(before);
  });

  it('asks for the first résumé and goes home from another page', async () => {
    const { fixture } = await render(SiteHeaderHost, { providers });
    const injector = fixture.debugElement.injector;
    const router = injector.get(Router);
    await router.navigateByUrl('/privacy');
    fixture.detectChanges();
    await userEvent.click(screen.getAllByRole('button', { name: /Résumé/ })[0]);
    await fixture.whenStable();
    // The home page picks the first résumé.
    expect(injector.get(ResumeLauncher).request()).toEqual({ slug: null, source: 'header' });
    expect(router.url).toBe('/');
  });
});
