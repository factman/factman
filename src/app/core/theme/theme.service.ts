import { computed, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

import { SITE } from '../config/site';
import {
  readStoredTheme,
  resolveTheme,
  type Theme,
  type ThemePreference,
  writeStoredTheme,
} from './resolve-theme';

/**
 * Light and Dark theme (FR-04). Keeps `data-theme` on `<html>` in step with the visitor's choice,
 * or with the system preference while they have not chosen. The pre-paint script in index.html
 * sets the same attribute before first paint, so there is no flash.
 */
@Injectable()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly fallback = inject(SITE).defaultTheme;
  private readonly storage = () => this.window?.localStorage;
  private readonly media = this.window?.matchMedia?.('(prefers-color-scheme: dark)');

  private readonly stored = signal<Theme | null>(readStoredTheme(this.storage));
  private readonly systemPrefersDark = signal<boolean | null>(
    this.media ? this.media.matches : null,
  );

  /** The visitor's explicit choice, or `system` while they follow the system preference. */
  readonly preference = computed<ThemePreference>(() => this.stored() ?? 'system');
  /** The theme on screen. */
  readonly theme = computed<Theme>(() =>
    resolveTheme(this.stored(), this.systemPrefersDark(), this.fallback),
  );

  constructor() {
    this.media?.addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));
    this.window?.addEventListener('storage', () => this.stored.set(readStoredTheme(this.storage)));
    effect(() => this.document.documentElement.setAttribute('data-theme', this.theme()));
  }

  /** Chooses a theme and remembers it; `system` forgets the choice and follows the system again. */
  set(preference: ThemePreference): void {
    const theme = preference === 'system' ? null : preference;
    writeStoredTheme(this.storage, theme);
    this.stored.set(theme);
  }

  /** Switches to the other theme and remembers it (the theme toggle). */
  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  /**
   * Hook for the terminal's `theme` command: `theme`, `theme light|dark|system|toggle`.
   * Returns the line the terminal prints.
   */
  command(arg = ''): string {
    const a = arg.trim().toLowerCase();
    if (a === '') return `theme: ${this.theme()} (${this.preference()})`;
    if (a === 'toggle') this.toggle();
    else if (a === 'light' || a === 'dark' || a === 'system') this.set(a);
    else return `theme: unknown option "${arg}". Use light, dark, system or toggle.`;
    return `theme: ${this.theme()}`;
  }
}
