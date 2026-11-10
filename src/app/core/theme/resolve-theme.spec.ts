import {
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeStoredTheme,
} from './resolve-theme';

const throwing = () =>
  ({
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      throw new Error('SecurityError');
    },
  }) as unknown as Storage;

describe('resolveTheme (FR-04)', () => {
  it('prefers the stored choice over the system preference and the default', () => {
    expect(resolveTheme('light', true, 'dark')).toBe('light');
    expect(resolveTheme('dark', false, 'light')).toBe('dark');
  });

  it('follows the system preference when nothing is stored', () => {
    expect(resolveTheme(null, true, 'light')).toBe('dark');
    expect(resolveTheme(null, false, 'dark')).toBe('light');
  });

  it('falls back to the site default when the system preference is unknown', () => {
    expect(resolveTheme(null, null, 'dark')).toBe('dark');
    expect(resolveTheme(null, null, 'system')).toBe('light');
  });

  it('ignores a stored value that is not a theme', () => {
    expect(resolveTheme('purple', true, 'light')).toBe('dark');
  });
});

describe('theme storage', () => {
  it('reads, writes and clears the choice', () => {
    localStorage.clear();
    expect(writeStoredTheme(() => localStorage, 'dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredTheme(() => localStorage)).toBe('dark');
    writeStoredTheme(() => localStorage, null);
    expect(readStoredTheme(() => localStorage)).toBeNull();
  });

  it('survives blocked or missing storage', () => {
    expect(readStoredTheme(throwing)).toBeNull();
    expect(writeStoredTheme(throwing, 'dark')).toBe(false);
    expect(readStoredTheme(() => undefined)).toBeNull();
    expect(writeStoredTheme(() => undefined, 'light')).toBe(false);
  });
});
