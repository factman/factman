/**
 * UI-01 (PRD §12): atoms. Button variants, sizes, disabled and loading, and a click emits once.
 * Link adds rel="noopener noreferrer" when external. Icon is aria-hidden unless labelled. Switch
 * toggles with Space. TextInput's error state sets aria-invalid and aria-describedby.
 * Plus the keyboard paths and reduced-motion variants of the atoms that move.
 */
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import {
  Button,
  Caret,
  Icon,
  Link,
  Switch,
  TextInput,
  Tooltip,
  Typewriter,
  iconDownload,
} from '@ui/atoms';

const router = [provideRouter([])];

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
  }));
}

/** The text an element's aria-describedby points at. */
const description = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .join(' ')
    .trim();

describe('UI-01 Atoms', () => {
  afterEach(() => vi.unstubAllGlobals());

  describe('Button', () => {
    it.each(['primary', 'secondary', 'tertiary', 'text', 'link'] as const)(
      'renders the %s variant',
      async (variant) => {
        await render(Button, { inputs: { variant }, providers: router });
        expect(screen.getByRole('button').classList).toContain(`fm-btn--${variant}`);
      },
    );

    it.each(['sm', 'md', 'lg', 'xl'] as const)('renders the %s size', async (size) => {
      await render(Button, { inputs: { size }, providers: router });
      expect(screen.getByRole('button').classList).toContain(`fm-btn--${size}`);
    });

    it('emits once per click, and once per Enter or Space', async () => {
      const pressed = vi.fn();
      await render(`<fm-button (pressed)="pressed()">Send</fm-button>`, {
        imports: [Button],
        providers: router,
        componentProperties: { pressed },
      });
      const button = screen.getByRole('button', { name: 'Send' });
      await userEvent.click(button);
      expect(pressed).toHaveBeenCalledTimes(1);
      button.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(pressed).toHaveBeenCalledTimes(3);
    });

    it.each([
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
    ])('never emits while %s', async (_, state) => {
      const pressed = vi.fn();
      await render(
        `<fm-button [disabled]="disabled" [loading]="loading" (pressed)="pressed()">Send</fm-button>`,
        {
          imports: [Button],
          providers: router,
          componentProperties: { pressed, disabled: false, loading: false, ...state },
        },
      );
      const button = screen.getByRole('button', { name: /Send/ });
      // Disabled is a real disabled button; loading stays enabled so focus stays put (ETE-250).
      expect(button).toHaveProperty('disabled', 'disabled' in state);
      await userEvent.click(button);
      expect(pressed).not.toHaveBeenCalled();
      if ('loading' in state) expect(button.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('Link', () => {
    it('adds rel="noopener noreferrer" and a new-tab note when external', async () => {
      await render(`<fm-link href="https://github.com/factman">GitHub</fm-link>`, {
        imports: [Link],
        providers: router,
      });
      const link = screen.getByRole('link', { name: /GitHub/ });
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.textContent).toMatch(/opens in a new tab/);
    });

    it('stays in the tab for paths in the site', async () => {
      await render(`<fm-link href="/projects">Projects</fm-link>`, {
        imports: [Link],
        providers: router,
      });
      const link = screen.getByRole('link', { name: 'Projects' });
      expect(link.getAttribute('rel')).toBeNull();
      expect(link.getAttribute('target')).toBeNull();
    });
  });

  describe('Icon', () => {
    it('is aria-hidden without a label', async () => {
      const { container } = await render(Icon, { inputs: { icon: iconDownload } });
      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(screen.queryByRole('img')).toBeNull();
    });

    it('is a named image with a label', async () => {
      await render(Icon, { inputs: { icon: iconDownload, label: 'Download' } });
      const svg = screen.getByRole('img', { name: 'Download' });
      expect(svg.getAttribute('aria-hidden')).toBeNull();
    });
  });

  describe('Switch', () => {
    it('toggles with Space and reports aria-checked', async () => {
      await render(Switch, { inputs: { label: 'Analytics cookies' } });
      const sw = screen.getByRole('switch', { name: 'Analytics cookies' });
      await userEvent.tab();
      expect(sw).toBe(document.activeElement);
      await userEvent.keyboard(' ');
      expect(sw.getAttribute('aria-checked')).toBe('true');
      await userEvent.keyboard(' ');
      expect(sw.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('TextInput', () => {
    it('sets aria-invalid and aria-describedby in its error state', async () => {
      await render(
        `<fm-text-input ariaLabel="Email" [invalid]="true" ariaDescribedby="email-error" />
         <p id="email-error">Enter an email address</p>`,
        { imports: [TextInput] },
      );
      const input = screen.getByRole('textbox', { name: 'Email' });
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(description(input)).toBe('Enter an email address');
    });
  });

  describe('keyboard paths', () => {
    it('Tab order follows the source order', async () => {
      await render(
        `<fm-button>First</fm-button><fm-link href="/next">Second</fm-link><fm-text-input ariaLabel="Third" />`,
        { imports: [Button, Link, TextInput], providers: router },
      );
      const order: string[] = [];
      for (let i = 0; i < 3; i++) {
        await userEvent.tab();
        const el = document.activeElement as HTMLElement;
        order.push(el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '');
      }
      expect(order).toEqual(['First', 'Second', 'Third']);
    });

    it('Escape closes a tooltip opened by focus', async () => {
      await render(`<button fmTooltip="Copy email">Copy</button>`, { imports: [Tooltip] });
      await userEvent.tab();
      expect(screen.getByRole('tooltip')).toBeTruthy();
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  describe('reduced motion', () => {
    it('Typewriter shows the first word and never cycles', async () => {
      stubReducedMotion(true);
      vi.useFakeTimers();
      const { container, fixture } = await render(Typewriter, {
        inputs: { words: ['Engineer', 'CTO'] },
      });
      await vi.advanceTimersByTimeAsync(10_000);
      fixture.detectChanges();
      expect(container.querySelector('.fm-typewriter__word')?.textContent).toBe('Engineer');
      vi.useRealTimers();
    });

    it('Caret is decorative either way (its blink stops in CSS)', async () => {
      stubReducedMotion(true);
      const { container } = await render(Caret);
      expect(container.querySelector('.fm-caret')?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
