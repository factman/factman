import { importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CoreModule } from '../core.module';
import { THEME_STORAGE_KEY } from './resolve-theme';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const html = document.documentElement;
  const setup = () => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(CoreModule.forRoot({ environment: 'production' }))],
    });
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  };

  beforeEach(() => {
    localStorage.clear();
    html.removeAttribute('data-theme');
  });

  it('starts from the site default and sets data-theme on <html>', () => {
    const theme = setup(); // jsdom has no matchMedia: no system preference
    expect(theme.preference()).toBe('system');
    expect(theme.theme()).toBe('light');
    expect(html.getAttribute('data-theme')).toBe('light');
  });

  it('starts from a stored choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(setup().theme()).toBe('dark');
    expect(html.getAttribute('data-theme')).toBe('dark');
  });

  it('remembers a choice, toggles, and forgets it with system', () => {
    const theme = setup();
    theme.set('dark');
    TestBed.tick();
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    theme.toggle();
    TestBed.tick();
    expect(theme.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    theme.set('system');
    expect(theme.preference()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('still switches theme when storage is blocked', () => {
    const theme = setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => theme.set('dark')).not.toThrow();
    TestBed.tick();
    expect(html.getAttribute('data-theme')).toBe('dark');
    vi.restoreAllMocks();
  });

  it('answers the terminal theme command', () => {
    const theme = setup();
    expect(theme.command()).toBe('theme: light (system)');
    expect(theme.command('dark')).toBe('theme: dark');
    expect(theme.command('toggle')).toBe('theme: light');
    expect(theme.command('purple')).toMatch(/unknown option "purple"/);
  });
});
