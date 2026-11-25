import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { CLOCK } from '@shared';

import { SiteFooter } from './site-footer';

const props = {
  theme: 'light',
  tagline: 'Fullstack Software Engineer and CTO in Lagos.',
  nav: [
    { label: 'Services', href: '/services' },
    { label: 'Privacy', href: '/privacy' },
  ],
  resumes: [
    { id: 'fullstack', title: 'Fullstack Software Engineer' },
    { id: 'mobile', title: 'Mobile Developer' },
  ],
  email: 'hello@example.com',
  location: 'Lagos, Nigeria · WAT (UTC+1)',
  socials: [{ id: 'github', label: 'GitHub', url: 'https://github.com/factman' }],
  year: undefined as number | undefined,
};

async function renderFooter(overrides: Partial<typeof props> = {}) {
  const openResume = vi.fn();
  const cookies = vi.fn();
  await render(
    `<main id="main" tabindex="-1">Page</main>
     <fm-site-footer [theme]="theme" [tagline]="tagline" [nav]="nav" [resumes]="resumes"
       [email]="email" [location]="location" [socials]="socials" [year]="year"
       (openResume)="openResume($event)" (cookies)="cookies()" />`,
    {
      imports: [SiteFooter],
      providers: [provideRouter([]), { provide: CLOCK, useValue: () => new Date('2026-11-10') }],
      componentProperties: { ...props, ...overrides, openResume, cookies },
    },
  );
  return { openResume, cookies };
}

describe('SiteFooter', () => {
  it('shows the tagline, Explore links, contact and socials', async () => {
    await renderFooter();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(props.tagline)).toBeTruthy();
    const explore = within(screen.getByRole('navigation', { name: 'Explore' }));
    expect(explore.getByRole('link', { name: 'Services' }).getAttribute('href')).toBe('/services');
    expect(explore.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: 'hello@example.com' }).getAttribute('href')).toBe(
      'mailto:hello@example.com',
    );
    expect(screen.getByText('Lagos, Nigeria · WAT (UTC+1)')).toBeTruthy();
    expect(screen.getByRole('link', { name: /GitHub/ }).getAttribute('href')).toBe(
      'https://github.com/factman',
    );
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
      'Explore',
      'Résumés',
      'Connect',
    ]);
  });

  it('asks for a résumé by id and for the cookie settings', async () => {
    const { openResume, cookies } = await renderFooter();
    const mobile = screen.getByRole('button', { name: 'Mobile Developer' });
    expect(mobile.getAttribute('aria-haspopup')).toBe('dialog');
    await userEvent.click(mobile);
    expect(openResume).toHaveBeenCalledWith('mobile');
    await userEvent.click(screen.getByRole('button', { name: 'cookie settings' }));
    expect(cookies).toHaveBeenCalledOnce();
  });

  it("takes the copyright year from the clock unless it's given", async () => {
    await renderFooter();
    expect(screen.getByText('© 2026 Odunayo Mohammed')).toBeTruthy();
  });

  it('uses the year it is given', async () => {
    await renderFooter({ year: 2030 });
    expect(screen.getByText('© 2030 Odunayo Mohammed')).toBeTruthy();
  });

  it('leaves out the location when there is none', async () => {
    await renderFooter({ location: undefined });
    expect(screen.queryByText(/WAT/)).toBeNull();
  });

  it('goes back to the top and puts focus at the start of the page', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await renderFooter();
    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(document.activeElement).toBe(screen.getByRole('main'));
    scrollTo.mockRestore();
  });
});
