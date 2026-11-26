import type { SiteHeaderPage } from '@ui/organisms/site-header/site-header';

const SECTIONS: readonly SiteHeaderPage[] = ['services', 'projects', 'blog'];

/**
 * The header's page for a URL: `home` on `/` (with or without a fragment or query), the section
 * for `/services`, `/projects`, `/blog` and their detail pages, else `other` (privacy, 404).
 */
export function pageOf(url: string): SiteHeaderPage {
  const first = url.split(/[?#]/)[0].split('/').filter(Boolean)[0] ?? '';
  if (!first) return 'home';
  return SECTIONS.find((s) => s === first) ?? 'other';
}
