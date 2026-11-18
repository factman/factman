/** A theme the page can render. */
export type Theme = 'light' | 'dark';
/** What the visitor (or the site default) asks for: a theme, or follow the system. */
export type ThemePreference = Theme | 'system';

/** localStorage key for the visitor's explicit choice ("necessary" storage in site.json consent). */
export const THEME_STORAGE_KEY = 'fm_theme';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

/**
 * Resolution order (FR-04): the stored choice, then the system preference, then the site default
 * (`site.defaultTheme`; `system` with no system preference falls back to light).
 * The pre-paint script in src/index.html implements the same order; a test keeps them in step.
 */
export function resolveTheme(
  stored: string | null,
  systemPrefersDark: boolean | null,
  fallback: ThemePreference,
): Theme {
  if (isTheme(stored)) return stored;
  if (systemPrefersDark !== null) return systemPrefersDark ? 'dark' : 'light';
  return isTheme(fallback) ? fallback : 'light';
}

/** Reads the stored choice; storage can be blocked (privacy mode, disabled cookies). */
export function readStoredTheme(storage: () => Storage | undefined): Theme | null {
  try {
    const value = storage()?.getItem(THEME_STORAGE_KEY) ?? null;
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Stores or clears the choice. Returns false when storage is unavailable; the theme still applies. */
export function writeStoredTheme(storage: () => Storage | undefined, theme: Theme | null): boolean {
  try {
    const s = storage();
    if (!s) return false;
    if (theme) s.setItem(THEME_STORAGE_KEY, theme);
    else s.removeItem(THEME_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
