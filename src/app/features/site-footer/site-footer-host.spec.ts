import { importProvidersFrom } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { CoreModule } from '@core';
import { OPEN_CONSENT_EVENT } from '@core/consent';
import { resumeDownloads } from '@data/resume-downloads';
import { ResumeLauncher } from '@shared';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

/** Any URL renders nothing, so following a link navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];
const providers = [
  provideRouter(ANY_ROUTE),
  importProvidersFrom(CoreModule.forRoot({ environment: 'production' })),
];

import { SiteFooterHost } from './site-footer-host';

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
