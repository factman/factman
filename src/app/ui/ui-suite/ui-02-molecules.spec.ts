/**
 * UI-02 (PRD §12): molecules. ThemeToggle announces its state. FormField associates label, input
 * and helper text. StatCounter counts once. ProjectCard shows a lock badge and no links when
 * private. ServiceCard is one focusable link. CopyButton shows "Copied", announces it, then resets.
 * Plus the keyboard paths and reduced-motion variants of the molecules that open or move.
 */
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { Project } from '@shared';
import { provideIcons } from '@ui/atoms/icon/icon-registry';
import { iconLightbulb } from '@ui/atoms/icon/icons';
import { TextInput } from '@ui/atoms/text-input/text-input';
import { Accordion } from '@ui/molecules/accordion/accordion';
import { COPIED_FOR, CopyButton } from '@ui/molecules/copy-button/copy-button';
import { Dialog } from '@ui/molecules/dialog/dialog';
import { FormField } from '@ui/molecules/form-field/form-field';
import { ProjectCard } from '@ui/molecules/project-card/project-card';
import { ServiceCard } from '@ui/molecules/service-card/service-card';
import { StatCounter } from '@ui/molecules/stat-counter/stat-counter';
import { ThemeToggle } from '@ui/molecules/theme-toggle/theme-toggle';

const router = [provideRouter([])];

const PRIVATE: Project = {
  id: 'ledger',
  slug: 'ledger',
  title: 'Ledger',
  summary: 'Internal ledger for a fintech.',
  category: 'Fintech',
  status: 'in-progress',
  visibility: 'private',
  featured: false,
  stack: ['Angular'],
  startedAt: '2024-01',
  links: { live: 'https://example.com', source: 'https://github.com/x/y' },
  engage: { mode: 'request-demo', note: 'Demo on request.' },
};

/** The text an element's aria-describedby points at. */
const description = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .join(' ')
    .trim();

describe('UI-02 Molecules', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('ThemeToggle announces its state', async () => {
    const { rerender } = await render(ThemeToggle, { inputs: { theme: 'light' } });
    expect(screen.getByRole('button', { name: 'Dark theme', pressed: false })).toBeTruthy();
    await rerender({ inputs: { theme: 'dark' } });
    expect(screen.getByRole('button', { name: 'Dark theme', pressed: true })).toBeTruthy();
  });

  it('FormField associates its label, input and helper text', async () => {
    await render(
      `<fm-form-field label="Email" hint="I'll only use it to reply"><fm-text-input /></fm-form-field>`,
      { imports: [FormField, TextInput] },
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(description(input)).toBe("I'll only use it to reply");
  });

  it('StatCounter counts once, however often it scrolls into view', async () => {
    const observers: { fire: (e: { isIntersecting: boolean }[]) => void; disconnected: boolean }[] =
      [];
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnected = false;
        constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
          observers.push({ fire: cb, disconnected: false });
        }
        observe() {
          // The test fires the callback itself.
        }
        disconnect() {
          observers[observers.length - 1].disconnected = true;
        }
      },
    );
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const { container, fixture } = await render(StatCounter, {
      inputs: { value: 12, label: 'years' },
    });
    observers[0].fire([{ isIntersecting: true }]);
    frames.splice(0).forEach((cb) => cb(Number.MAX_SAFE_INTEGER));
    fixture.detectChanges();
    expect(container.querySelector('.stat-counter-value')?.textContent).toBe('12');
    expect(observers[0].disconnected).toBe(true);
    expect(observers).toHaveLength(1);
  });

  it('StatCounter shows the final value with reduced motion', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    const io = vi.fn();
    vi.stubGlobal('IntersectionObserver', io);
    const { container } = await render(StatCounter, { inputs: { value: 40, label: 'projects' } });
    expect(container.querySelector('.stat-counter-value')?.textContent).toBe('40');
    expect(io).not.toHaveBeenCalled();
  });

  it('ProjectCard shows a lock badge and no live or source links when private', async () => {
    await render(ProjectCard, {
      inputs: { project: PRIVATE, href: '/projects/ledger' },
      providers: router,
    });
    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Live site|Source/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Request a demo' })).toBeTruthy();
  });

  it('ServiceCard (tile) is one focusable link', async () => {
    const { container } = await render(ServiceCard, {
      inputs: {
        service: {
          slug: 'consultancy',
          title: 'Consultancy',
          summary: 'Advice.',
          icon: 'lightbulb',
          deliverables: ['Review'],
        },
        href: '/services/consultancy',
      },
      providers: [...router, provideIcons([iconLightbulb])],
    });
    const focusable = container.querySelectorAll(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Consultancy' })).toBe(focusable[0]);
  });

  it('CopyButton shows "Copied", announces it, then resets', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const { fixture } = await render(CopyButton, {
      inputs: { value: 'hello@example.com', label: 'Copy email' },
    });
    await user.click(screen.getByRole('button', { name: 'Copy email' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/Copied hello@example.com/);
    vi.advanceTimersByTime(COPIED_FOR);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Copy email' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('');
  });

  describe('keyboard paths', () => {
    it('Accordion opens with Enter and Space', async () => {
      await render(Accordion, {
        inputs: { items: [{ id: 'a', title: 'How long?', content: 'Four to twelve weeks.' }] },
      });
      const head = screen.getByRole('button', { name: 'How long?' });
      await userEvent.tab();
      expect(head).toBe(document.activeElement);
      await userEvent.keyboard('{Enter}');
      expect(head.getAttribute('aria-expanded')).toBe('true');
      await userEvent.keyboard(' ');
      expect(head.getAttribute('aria-expanded')).toBe('false');
    });

    it('Dialog asks to close on Escape (cancel)', async () => {
      const closed = vi.fn();
      await render(
        `<fm-dialog [open]="true" label="Résumé" (closed)="closed()"><p>Body</p></fm-dialog>`,
        {
          imports: [Dialog],
          componentProperties: { closed },
        },
      );
      const dialog = screen.getByRole('dialog', { name: 'Résumé' });
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
      expect(closed).toHaveBeenCalledOnce();
    });
  });
});
