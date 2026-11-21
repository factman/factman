import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { SiteNavItem } from '@shared';

import { SiteHeader } from './site-header';

const nav: SiteNavItem[] = [
  { id: 'about', label: 'About', anchor: '#about' },
  { id: 'services', label: 'Services', anchor: '#services', route: '/services' },
  { id: 'projects', label: 'Projects', anchor: '#projects', route: '/projects' },
  { id: 'contact', label: 'Contact', anchor: '#contact' },
];

// jsdom doesn't evaluate media queries, so the mobile-only controls would stay `display: none`.
// After each render this sheet shows them as a phone-width screen would (jsdom's cascade goes by
// source order, so it has to come after the component's styles); the Mobile story checks 390px.
const phone = document.createElement('style');
phone.textContent = '.site-header-mobile { display: flex !important; }';
afterAll(() => phone.remove());

async function renderHeader(props: Record<string, unknown> = {}) {
  const resume = vi.fn();
  const themeChange = vi.fn();
  const result = await render(
    `<fm-site-header [nav]="nav" [current]="current" [theme]="theme" [active]="active"
       (openResume)="resume()" (themeChange)="themeChange($event)" />
     <p><button>Outside</button></p>`,
    {
      imports: [SiteHeader],
      providers: [provideRouter([])],
      componentProperties: {
        nav,
        current: 'home',
        theme: 'light',
        active: undefined,
        resume,
        themeChange,
        ...props,
      },
    },
  );
  document.head.append(phone);
  return { ...result, resume, themeChange };
}

const primary = () => within(screen.getByRole('navigation', { name: 'Primary' }));
const menuButton = () => screen.getByRole('button', { name: 'Menu' });
const menuNav = () => screen.queryByRole('navigation', { name: 'Menu' });

describe('SiteHeader', () => {
  it('links to home sections on the home page and marks the one in view', async () => {
    await renderHeader({ active: 'projects' });
    expect(primary().getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/#about');
    const services = primary().getByRole('link', { name: 'Services' });
    expect(services.getAttribute('href')).toBe('/#services');
    expect(services.getAttribute('aria-current')).toBeNull();
    const projects = primary().getByRole('link', { name: 'Projects' });
    expect(projects.getAttribute('aria-current')).toBe('location');
    expect(projects.classList).toContain('is-active');
  });

  it('opens pages from other pages and marks the current page', async () => {
    await renderHeader({ current: 'services' });
    const services = primary().getByRole('link', { name: 'Services' });
    expect(services.getAttribute('href')).toBe('/services');
    expect(services.getAttribute('aria-current')).toBe('page');
    expect(primary().getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/#about');
    expect(primary().getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/#contact');
  });

  it('has a home link, Résumé, the theme toggle and Book a service', async () => {
    const { resume, themeChange } = await renderHeader({ current: 'other' });
    expect(screen.getByRole('link', { name: 'Odunayo Mohammed, home' }).getAttribute('href')).toBe(
      '/',
    );
    const [resumeButton] = screen.getAllByRole('button', { name: 'Résumé' });
    expect(resumeButton.getAttribute('aria-haspopup')).toBe('dialog');
    await userEvent.click(resumeButton);
    expect(resume).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Dark theme' }));
    expect(themeChange).toHaveBeenCalledWith('dark');
    expect(screen.getByRole('link', { name: 'Book a service' }).getAttribute('href')).toBe(
      '/services',
    );
  });

  it('scrolls to the top when the logo is clicked on the home page', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await renderHeader();
    await userEvent.click(screen.getByRole('link', { name: 'Odunayo Mohammed, home' }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    scrollTo.mockRestore();
  });

  it('opens the menu, moves focus in, keeps Tab inside and closes on Escape', async () => {
    await renderHeader();
    const button = menuButton();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(menuNav()).toBeNull();

    await userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const menu = within(menuNav()!);
    expect(button.getAttribute('aria-controls')).toBe(menuNav()!.id);
    const first = menu.getByRole('link', { name: 'About' });
    const last = menu.getByRole('link', { name: 'Book a service' });
    expect(document.activeElement).toBe(first);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(button);
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    last.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(last);

    await userEvent.keyboard('{Escape}');
    expect(menuNav()).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('closes the menu when a link is followed or on a click outside', async () => {
    await renderHeader();
    await userEvent.click(menuButton());
    const menu = within(menuNav()!);
    await userEvent.click(menu.getByRole('link', { name: 'Contact' }));
    expect(menuNav()).toBeNull();

    await userEvent.click(menuButton());
    expect(menuNav()!).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    expect(menuNav()).toBeNull();
  });

  it('closes the menu before asking for the résumé, with focus back on the menu button', async () => {
    const { resume } = await renderHeader();
    await userEvent.click(menuButton());
    const menu = within(menuNav()!);
    await userEvent.click(menu.getByRole('button', { name: 'Résumé' }));
    expect(resume).toHaveBeenCalledOnce();
    expect(menuNav()).toBeNull();
    expect(document.activeElement).toBe(menuButton());
  });
});
