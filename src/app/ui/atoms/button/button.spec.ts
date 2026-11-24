import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconArrowRight, iconDownload } from '../icon/icons';
import { Button } from './button';

const router = [provideRouter([])];

describe('Button', () => {
  it('is a primary md button that emits pressed on click, Enter and Space', async () => {
    const pressed = vi.fn();
    await render(`<fm-button (pressed)="pressed($event)">Book a service</fm-button>`, {
      imports: [Button],
      componentProperties: { pressed },
    });
    const button = screen.getByRole('button', { name: 'Book a service' });
    expect([...button.classList].sort()).toEqual(['fm-btn', 'fm-btn--md', 'fm-btn--primary']);
    expect(button.getAttribute('type')).toBe('button');
    const user = userEvent.setup();
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(pressed).toHaveBeenCalledTimes(3);
    expect(pressed.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it('applies variant, size and icons', async () => {
    const { container } = await render(Button, {
      inputs: {
        variant: 'secondary',
        size: 'lg',
        leadingIcon: iconDownload,
        trailingIcon: iconArrowRight,
      },
    });
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.classList).toContain('fm-btn--secondary');
    expect(button.classList).toContain('fm-btn--lg');
    const icons = [...button.querySelectorAll('svg.fm-icon')].map((s) =>
      s.getAttribute('data-icon'),
    );
    expect(icons).toEqual(['download', 'arrow-right']);
    expect(button.querySelector('svg')?.getAttribute('width')).toBe('20');
  });

  it('does not emit while disabled', async () => {
    const pressed = vi.fn();
    await render(`<fm-button [disabled]="true" (pressed)="pressed()">Save</fm-button>`, {
      imports: [Button],
      componentProperties: { pressed },
    });
    const button = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await userEvent.setup().click(button);
    expect(pressed).not.toHaveBeenCalled();
  });

  it('shows a spinner, is busy and does not emit while loading', async () => {
    const pressed = vi.fn();
    await render(
      `<fm-button [loading]="true" [leadingIcon]="icon" (pressed)="pressed()">Saving</fm-button>`,
      { imports: [Button], componentProperties: { pressed, icon: iconDownload } },
    );
    const button = screen.getByRole('button', { name: 'Saving' }) as HTMLButtonElement;
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.classList).toContain('is-loading');
    // Not disabled: a disabled button would drop keyboard focus (ETE-250).
    expect(button.disabled).toBe(false);
    expect(button.querySelector('.fm-spinner')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.querySelector('svg.fm-icon')).toBeNull();
    await userEvent.setup().click(button);
    expect(pressed).not.toHaveBeenCalled();
  });

  it('keeps focus when it starts loading, and blocks Enter while loading', async () => {
    const pressed = vi.fn();
    const { rerender } = await render(
      `<fm-button [loading]="loading" (pressed)="pressed()">Send</fm-button>`,
      { imports: [Button], componentProperties: { pressed, loading: false } },
    );
    const button = screen.getByRole('button', { name: 'Send' });
    button.focus();
    await rerender({ componentProperties: { pressed, loading: true } });
    expect(document.activeElement).toBe(button);
    await userEvent.setup().keyboard('{Enter}');
    expect(pressed).not.toHaveBeenCalled();
  });

  it('exposes a toggle state with aria-pressed', async () => {
    await render(Button, { inputs: { toggled: true } });
    const button = screen.getByRole('button', { pressed: true });
    expect(button.classList).toContain('is-pressed');
  });

  it('links to app paths with the router', async () => {
    await render(`<fm-button href="/projects" variant="secondary">View projects</fm-button>`, {
      imports: [Button],
      providers: router,
    });
    const link = screen.getByRole('link', { name: 'View projects' });
    expect(link.getAttribute('href')).toBe('/projects');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('opens other sites in a new tab with a hidden note', async () => {
    await render(`<fm-button href="https://medium.com/@factman60">Medium</fm-button>`, {
      imports: [Button],
      providers: router,
    });
    const link = screen.getByRole('link', { name: /^Medium\s*\(opens in a new tab\)$/ });
    expect(link.querySelector('.fm-sr')?.textContent?.trim()).toBe('(opens in a new tab)');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('opens mail and phone links in place', async () => {
    await render(`<fm-button href="tel:+2347066780373">Call</fm-button>`, {
      imports: [Button],
      providers: router,
    });
    const link = screen.getByRole('link', { name: 'Call' });
    expect(link.getAttribute('href')).toBe('tel:+2347066780373');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('renders a disabled link without an href and does not emit', async () => {
    const pressed = vi.fn();
    await render(
      `<fm-button href="/projects" [disabled]="true" (pressed)="pressed()">Projects</fm-button>`,
      { imports: [Button], providers: router, componentProperties: { pressed } },
    );
    const link = screen.getByRole('link', { name: 'Projects' });
    expect(link.getAttribute('href')).toBeNull();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    await userEvent.setup().click(link);
    expect(pressed).not.toHaveBeenCalled();
  });

  it('stretches to its container when full', async () => {
    const { container } = await render(Button, { inputs: { full: true } });
    expect((container.querySelector('button') as HTMLElement).style.width).toBe('100%');
  });
});
