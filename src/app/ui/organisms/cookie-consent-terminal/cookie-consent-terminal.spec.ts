import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import {
  CONSENT_COMMAND,
  CONSENT_TYPING,
  type ConsentCategoryView,
  CookieConsentTerminal,
} from './cookie-consent-terminal';

const categories: ConsentCategoryView[] = [
  {
    id: 'necessary',
    label: 'necessary',
    description: 'always on',
    required: true,
    granted: true,
  },
  { id: 'analytics', label: 'analytics', description: 'GA4', required: false, granted: false },
  {
    id: 'advertising',
    label: 'advertising',
    description: 'not used on this site',
    required: false,
    used: false,
    granted: false,
  },
];

/** Long enough for the command to finish typing. */
const TYPED_MS = CONSENT_TYPING.start + CONSENT_TYPING.perChar * (CONSENT_COMMAND.length + 2);

const renderBanner = async (inputs: Record<string, unknown> = {}, typed = true) => {
  const decide = vi.fn();
  const dismissed = vi.fn();
  const view = await render(CookieConsentTerminal, {
    inputs: { open: true, categories, floating: false, ...inputs },
    on: { decide, dismissed },
    providers: [provideRouter([])],
  });
  if (typed) await screen.findByRole('button', { name: 'Accept all' }, { timeout: 2000 });
  return { ...view, decide, dismissed };
};

const typeInBanner = async (keys: string) => {
  screen.getByRole('dialog').focus();
  await userEvent.keyboard(keys);
};

describe('CookieConsentTerminal', () => {
  it('types the command with a caret, then shows the message and choices', async () => {
    vi.useFakeTimers();
    try {
      const { fixture } = await renderBanner({}, false);
      const prompt = () => screen.getByText(/^\.\/consent/, { selector: '.fm-term__cmd' });
      expect(screen.queryByRole('button', { name: 'Accept all' })).toBeNull();
      expect(document.querySelector('.fm-caret')).not.toBeNull();
      vi.advanceTimersByTime(TYPED_MS);
      fixture.detectChanges();
      expect(prompt().textContent).toBe(CONSENT_COMMAND);
      expect(document.querySelector('.fm-caret')).toBeNull();
      expect(screen.getByText(/uses Google Analytics to count visits/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows the whole command at once with reduced motion', async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as typeof matchMedia;
    try {
      await renderBanner({}, false);
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeTruthy();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it('is a dark dialog named "Cookie settings" with the policy link', async () => {
    await renderBanner();
    const dialog = screen.getByRole('dialog', { name: 'Cookie settings' });
    expect(dialog.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('link', { name: 'privacy --cookies' }).getAttribute('href')).toBe(
      '/privacy',
    );
  });

  it('shows Accept necessary and Accept all as the same primary button', async () => {
    await renderBanner();
    const necessary = screen.getByRole('button', { name: 'Accept necessary' });
    const all = screen.getByRole('button', { name: 'Accept all' });
    expect(necessary.className).toBe(all.className);
    expect(all.className).toContain('fm-btn--primary');
  });

  it('accepts necessary only, or everything used; unused categories stay off', async () => {
    const { decide } = await renderBanner();
    await userEvent.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(decide).toHaveBeenLastCalledWith({
      necessary: true,
      analytics: true,
      advertising: false,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Accept necessary' }));
    expect(decide).toHaveBeenLastCalledWith({
      necessary: true,
      analytics: false,
      advertising: false,
    });
  });

  it('saves a choice from Customize, where only analytics is a switch', async () => {
    const { decide } = await renderBanner();
    await userEvent.click(screen.getByRole('button', { name: 'Customize' }));
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    const lineOf = (text: RegExp) =>
      screen.getByText((_, el) => el?.tagName === 'P' && text.test(el.textContent ?? ''));
    expect(lineOf(/necessary {3}always on/).textContent).toMatch(/^\[x\]/);
    expect(lineOf(/advertising {3}not used/).textContent).toMatch(/^\[ \]/);
    const analytics = screen.getByRole('switch', { name: /analytics/ });
    expect(analytics.getAttribute('aria-checked')).toBe('false');
    await userEvent.click(analytics);
    expect(analytics.getAttribute('aria-checked')).toBe('true');
    expect(analytics.textContent).toContain('[x]');
    await userEvent.click(screen.getByRole('button', { name: 'Save choices' }));
    expect(decide).toHaveBeenCalledWith({ necessary: true, analytics: true, advertising: false });
  });

  it('goes back from Customize with Back and with Esc', async () => {
    const { dismissed } = await renderBanner();
    await userEvent.click(screen.getByRole('button', { name: 'Customize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Accept all' })).toBeTruthy();
    await typeInBanner('c');
    expect(screen.getByRole('switch')).toBeTruthy();
    await typeInBanner('{Escape}');
    expect(screen.getByRole('button', { name: 'Accept all' })).toBeTruthy();
    expect(dismissed).not.toHaveBeenCalled();
  });

  it('responds to n and a with focus inside, not with a modifier', async () => {
    const { decide } = await renderBanner();
    await typeInBanner('{Control>}a{/Control}');
    expect(decide).not.toHaveBeenCalled();
    await typeInBanner('n');
    expect(decide).toHaveBeenLastCalledWith(expect.objectContaining({ analytics: false }));
    await typeInBanner('a');
    expect(decide).toHaveBeenLastCalledWith(expect.objectContaining({ analytics: true }));
  });

  it('closes on Esc from the main view without deciding', async () => {
    const { decide, dismissed } = await renderBanner();
    await typeInBanner('{Escape}');
    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(decide).not.toHaveBeenCalled();
  });

  describe('floating', () => {
    it('takes focus when asked and gives it back when it closes', async () => {
      const opener = document.createElement('button');
      document.body.append(opener);
      opener.focus();

      const { fixture } = await renderBanner({ floating: true, focusOnOpen: true });
      expect(document.activeElement).toBe(screen.getByRole('dialog'));

      fixture.componentRef.setInput('open', false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(opener);
      opener.remove();
    });

    it('does not take focus on a first visit', async () => {
      const page = document.createElement('button');
      document.body.append(page);
      page.focus();
      await renderBanner({ floating: true });
      expect(document.activeElement).toBe(page);
      page.remove();
    });
  });
});
