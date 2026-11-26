import { importProvidersFrom } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { CoreModule } from '@core';
import { OPEN_CONSENT_EVENT } from '@core/consent';
import { ThemeService } from '@core/theme';
import { resumeDownloads } from '@data/resume-downloads';
import { ResumeLauncher } from '@shared';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SiteFooterHost } from './site-footer-host';
import { SiteHeaderHost } from './site-header-host';

/** Any URL renders nothing, so following a link navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];
const providers = [
  provideRouter(ANY_ROUTE),
  importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
];

describe('Shell', () => {
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
      expect(injector.get(ResumeLauncher).request()).toEqual({
        slug: resumeDownloads[0].slug,
        source: 'header',
      });
      expect(router.url).toBe('/');
    });
  });

  describe('SiteFooterHost', () => {
    it('lists the pages, the résumés and the contact details', async () => {
      await render(SiteFooterHost, { providers });
      const explore = within(screen.getByRole('navigation', { name: 'Explore' }));
      expect(explore.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
        '/services',
        '/projects',
        '/blog',
        '/privacy',
      ]);
      for (const r of resumeDownloads)
        expect(screen.getByRole('button', { name: r.title })).toBeTruthy();
      expect(screen.getByText('Lagos, Nigeria · WAT (UTC+1)')).toBeTruthy();
    });

    it('opens a résumé on the home page and reopens the consent banner', async () => {
      const { fixture } = await render(SiteFooterHost, { providers });
      const injector = fixture.debugElement.injector;
      const router = injector.get(Router);
      await router.navigateByUrl('/blog');
      const last = resumeDownloads.at(-1)!;
      await userEvent.click(screen.getByRole('button', { name: last.title }));
      await fixture.whenStable();
      expect(injector.get(ResumeLauncher).request()).toEqual({ slug: last.slug, source: 'footer' });
      expect(router.url).toBe('/');

      const opened = vi.fn();
      document.addEventListener(OPEN_CONSENT_EVENT, opened);
      await userEvent.click(screen.getByRole('button', { name: 'cookie settings' }));
      expect(opened).toHaveBeenCalledOnce();
      document.removeEventListener(OPEN_CONSENT_EVENT, opened);
    });
  });
});
