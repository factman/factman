import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { type ConsentCategoryView, CookieConsentTerminal } from './cookie-consent-terminal';

const categories: ConsentCategoryView[] = [
  { id: 'necessary', label: 'necessary', description: 'always on', required: true, granted: true },
  { id: 'analytics', label: 'analytics', description: 'GA4', required: false, granted: false },
];

const renderBanner = async (inputs: Record<string, unknown> = {}) => {
  const decide = vi.fn();
  const dismissed = vi.fn();
  const view = await render(CookieConsentTerminal, {
    inputs: { open: true, categories, floating: false, ...inputs },
    on: { decide, dismissed },
    providers: [provideRouter([])],
  });
  return { ...view, decide, dismissed };
};

describe('CookieConsentTerminal', () => {
  it('is a dialog named "Cookie settings" with the policy link', async () => {
    await renderBanner();
    expect(screen.getByRole('dialog', { name: 'Cookie settings' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy policy' }).getAttribute('href')).toBe(
      '/privacy',
    );
  });

  it('shows Accept all and Reject all at the same size and style', async () => {
    await renderBanner();
    const accept = screen.getByRole('button', { name: /Accept all/ });
    const reject = screen.getByRole('button', { name: /Reject all/ });
    expect(accept.className).toBe(reject.className);
  });

  it('accepts and rejects every optional category; necessary stays on', async () => {
    const { decide } = await renderBanner();
    await userEvent.click(screen.getByRole('button', { name: /Accept all/ }));
    expect(decide).toHaveBeenLastCalledWith({ necessary: true, analytics: true });
    await userEvent.click(screen.getByRole('button', { name: /Reject all/ }));
    expect(decide).toHaveBeenLastCalledWith({ necessary: true, analytics: false });
  });

  it('saves a per-category choice from Customize; necessary cannot be switched off', async () => {
    const { decide } = await renderBanner();
    await userEvent.click(screen.getByRole('button', { name: /Customize/ }));
    const necessary = screen.getByRole('switch', { name: /necessary/ }) as HTMLInputElement;
    expect(necessary.checked).toBe(true);
    expect(necessary.disabled).toBe(true);
    await userEvent.click(screen.getByRole('switch', { name: /analytics/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save choices' }));
    expect(decide).toHaveBeenCalledWith({ necessary: true, analytics: true });
  });

  it('starts Customize from the current choice', async () => {
    await renderBanner({
      categories: [categories[0], { ...categories[1], granted: true }],
    });
    await userEvent.click(screen.getByRole('button', { name: /Customize/ }));
    expect((screen.getByRole('switch', { name: /analytics/ }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it('responds to a, r and c with focus inside', async () => {
    const { decide } = await renderBanner();
    screen.getByRole('button', { name: /Accept all/ }).focus();
    await userEvent.keyboard('c');
    expect(screen.getByRole('switch', { name: /analytics/ })).toBeTruthy();
    await userEvent.keyboard('r');
    expect(decide).toHaveBeenLastCalledWith({ necessary: true, analytics: false });
    await userEvent.keyboard('a');
    expect(decide).toHaveBeenLastCalledWith({ necessary: true, analytics: true });
  });

  it('ignores the letter keys with a modifier', async () => {
    const { decide } = await renderBanner();
    screen.getByRole('button', { name: /Accept all/ }).focus();
    await userEvent.keyboard('{Control>}a{/Control}');
    expect(decide).not.toHaveBeenCalled();
  });

  it('closes on Esc and from the close button without deciding', async () => {
    const { decide, dismissed } = await renderBanner();
    screen.getByRole('button', { name: /Reject all/ }).focus();
    await userEvent.keyboard('{Escape}');
    expect(dismissed).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Close consent.sh' }));
    expect(dismissed).toHaveBeenCalledTimes(2);
    expect(decide).not.toHaveBeenCalled();
  });

  describe('floating', () => {
    it('takes focus when asked and gives it back when it closes', async () => {
      const opener = document.createElement('button');
      opener.textContent = 'cookie settings';
      document.body.append(opener);
      opener.focus();

      const { fixture } = await renderBanner({ floating: true, focusOnOpen: true });
      expect(document.activeElement?.textContent).toContain('Accept all');

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
