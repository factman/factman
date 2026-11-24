import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@core/theme';

import { openApp } from './it-harness';

// IT-08 (US-20): the visitor's theme choice survives route changes.
describe('IT-08 Theme choice survives route changes', () => {
  beforeEach(() => localStorage.clear());

  it('keeps Dark, and then Light, across every page', async () => {
    const { go } = await openApp('/');
    const theme = TestBed.inject(ThemeService);
    const html = TestBed.inject(DOCUMENT).documentElement;
    for (const choice of ['dark', 'light'] as const) {
      theme.set(choice);
      for (const url of ['/services', '/projects/graphui', '/blog', '/privacy', '/']) {
        await go(url);
        expect(theme.theme(), url).toBe(choice);
        expect(html.getAttribute('data-theme'), url).toBe(choice);
      }
    }
  });
});
