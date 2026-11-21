import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { site } from '@data/site';

import { SiteHeader } from './site-header';

type Args = SiteHeader & { resume: () => void; themeChange: (t: string) => void };

/**
 * The fixed glass header: logo, primary navigation (site.json), Résumé, theme toggle and Book a
 * service; a menu button and panel below 1024px. The page passes `themeChange` to ThemeService
 * and opens the résumé on `openResume`.
 */
const meta: Meta<Args> = {
  title: 'Organisms/SiteHeader',
  component: SiteHeader,
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
  parameters: { layout: 'fullscreen' },
  args: { current: 'home', resume: fn(), themeChange: fn() },
  render: (args, { globals }) => ({
    props: { ...args, nav: site.nav, theme: globals['theme'] === 'dark' ? 'dark' : 'light' },
    template: `
      <fm-site-header [nav]="nav" [current]="current" [theme]="theme" [active]="active"
        (openResume)="resume()" (themeChange)="themeChange($event)" />
      <div style="height: 480px; padding: var(--padding-lg); font: 400 16px/1.7 var(--font-sans); color: var(--text-secondary)">
        Page content scrolls under the header.
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Home: Story = {
  play: async ({ canvas, args }) => {
    const nav = within(canvas.getByRole('navigation', { name: 'Primary' }));
    await expect(nav.getByRole('link', { name: 'Services' })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/#services$/),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Résumé' }));
    await expect(args.resume).toHaveBeenCalledOnce();
  },
};

/** On the home page the section in view (scroll-spy) is highlighted. */
export const SectionInView: Story = { args: { active: 'projects' } };

/** On another page its nav item is the current page and links open pages. */
export const ServicesPage: Story = {
  args: { current: 'services' },
  play: async ({ canvas }) => {
    const nav = within(canvas.getByRole('navigation', { name: 'Primary' }));
    await expect(nav.getByRole('link', { name: 'Services' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

/** Below 1024px: the menu button opens the panel; Escape closes it and returns focus. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Menu' });
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = within(canvas.getByRole('navigation', { name: 'Menu' }));
    await expect(menu.getByRole('link', { name: 'About' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(button).toHaveFocus();
    await expect(canvas.queryByRole('navigation', { name: 'Menu' })).toBeNull();
  },
};

/** The menu panel open on a phone. */
export const MobileMenuOpen: Story = {
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }));
    // The panel fades in (200ms), so wait for it to finish.
    const menu = canvas.getByRole('navigation', { name: 'Menu' });
    await waitFor(() => expect(menu).toBeVisible());
  },
};
