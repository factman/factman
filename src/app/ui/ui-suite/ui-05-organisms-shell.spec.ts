/**
 * UI-05 (PRD §12): organisms, shell. SiteHeader's mobile menu opens from the keyboard, closes on
 * Escape and gives focus back. CookieConsentTerminal answers `n` (Accept necessary), `a` (Accept
 * all), `c` (Customize) and Escape, takes focus when asked and gives it back, shows its two
 * choices at the same size, and skips the typing with reduced motion. ContactForm shows inline
 * errors and announces them.
 */
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { SiteNavItem } from '@shared';
import { ContactForm } from '@ui/organisms/contact-form/contact-form';
import {
  type ConsentCategoryView,
  CookieConsentTerminal,
} from '@ui/organisms/cookie-consent-terminal/cookie-consent-terminal';
import { SiteHeader } from '@ui/organisms/site-header/site-header';

/** Any URL renders nothing, so following a link in a test navigates without an error. */
const ANY_ROUTE = [{ path: '**', children: [] }];

const nav: SiteNavItem[] = [
  { id: 'about', label: 'About', anchor: '#about' },
  { id: 'services', label: 'Services', anchor: '#services', route: '/services' },
];

const categories: ConsentCategoryView[] = [
  { id: 'necessary', label: 'necessary', description: 'always on', required: true, granted: true },
  { id: 'analytics', label: 'analytics', description: 'GA4', required: false, granted: false },
];

describe('UI-05 Organisms: shell', () => {
  afterEach(() => vi.unstubAllGlobals());

  it("SiteHeader's mobile menu opens from the keyboard, closes on Escape and returns focus", async () => {
    // jsdom doesn't evaluate media queries; show the phone-width controls.
    const phone = document.createElement('style');
    phone.textContent = '.site-header-mobile { display: flex !important; }';
    await render(`<fm-site-header [nav]="nav" current="home" theme="light" />`, {
      imports: [SiteHeader],
      providers: [provideRouter(ANY_ROUTE)],
      componentProperties: { nav },
    });
    document.head.append(phone);
    const button = screen.getByRole('button', { name: 'Menu' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('navigation', { name: 'Menu' });
    expect(document.activeElement).toBe(within(menu).getByRole('link', { name: 'About' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Menu' })).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
    phone.remove();
  });

  describe('CookieConsentTerminal', () => {
    const renderBanner = async (inputs: Record<string, unknown> = {}) => {
      const decide = vi.fn();
      const dismissed = vi.fn();
      const view = await render(CookieConsentTerminal, {
        inputs: { open: true, categories, floating: false, ...inputs },
        on: { decide, dismissed },
        providers: [provideRouter([])],
      });
      await screen.findByRole('button', { name: 'Accept all' }, { timeout: 2000 });
      return { ...view, decide, dismissed };
    };
    const press = async (keys: string) => {
      screen.getByRole('dialog').focus();
      await userEvent.keyboard(keys);
    };

    it('answers n, a and c, and Escape goes back from Customize or closes', async () => {
      const { decide, dismissed } = await renderBanner();
      await press('n');
      expect(decide).toHaveBeenLastCalledWith({ necessary: true, analytics: false });
      await press('a');
      expect(decide).toHaveBeenLastCalledWith({ necessary: true, analytics: true });
      await press('c');
      expect(screen.getByRole('switch', { name: /analytics/ })).toBeTruthy();
      await press('{Escape}');
      expect(screen.queryByRole('switch')).toBeNull();
      expect(dismissed).not.toHaveBeenCalled();
      await press('{Escape}');
      expect(dismissed).toHaveBeenCalledTimes(1);
    });

    it('takes focus when asked, gives it back on close, and offers both choices at one size', async () => {
      const opener = document.createElement('button');
      document.body.append(opener);
      opener.focus();
      const { fixture } = await renderBanner({ floating: true, focusOnOpen: true });
      expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Cookie settings' }));
      const necessary = screen.getByRole('button', { name: 'Accept necessary' });
      const all = screen.getByRole('button', { name: 'Accept all' });
      expect(necessary.className).toBe(all.className);
      // Tab reaches both choices, necessary first.
      await userEvent.tab();
      expect(document.activeElement).toBe(necessary);
      await userEvent.tab();
      expect(document.activeElement).toBe(all);
      fixture.componentRef.setInput('open', false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(opener);
      opener.remove();
    });

    it('shows the command and choices at once with reduced motion', async () => {
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
      await render(CookieConsentTerminal, {
        inputs: { open: true, categories, floating: false },
        providers: [provideRouter([])],
      });
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeTruthy();
      expect(document.querySelector('.fm-caret')).toBeNull();
    });
  });

  it('ContactForm shows inline errors, announces them and marks the fields', async () => {
    await render(ContactForm, {
      inputs: { email: 'factman60@gmail.com', topics: ['General enquiry', 'DevOps'] },
      providers: [provideRouter([])],
    });
    // Each field's error region is in the page from the start (empty), so it is announced when
    // filled; the consent checkbox's error is an alert.
    const live = () =>
      [...document.querySelectorAll('[aria-live="polite"]')]
        .map((r) => r.textContent?.trim())
        .filter(Boolean);
    expect(live()).toEqual([]);
    screen.getByRole('button', { name: /Compose email/ }).focus();
    await userEvent.keyboard('{Enter}');
    expect(live()).toContain('Enter your name');
    expect(live().length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole('alert').textContent).toMatch(/Agree to be contacted/);
    const name = screen.getByLabelText(/^Name/);
    expect(name.getAttribute('aria-invalid')).toBe('true');
    const described = (name.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');
    expect(described).toContain('Enter your name');
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement).toBe(name);
  });
});
