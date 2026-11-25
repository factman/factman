import type { ResolvedSite } from '@shared';

/**
 * What a route says about itself for search engines and link previews: `data: { seo }` on static
 * routes, a `seo` resolver on detail routes (built from the project or service). Everything is
 * optional; the site defaults fill the gaps.
 */
export interface PageSeo {
  /** Meta description, 50 to 160 characters; defaults to `site.description`. */
  readonly description?: string;
  /** `noindex` keeps the page out of search results (the not-found page). Previews are always noindex. */
  readonly robots?: 'noindex';
  /** Open Graph type: `website` (default) or `article` for detail pages. */
  readonly type?: 'website' | 'article';
}

/** A meta tag, keyed by `name` (description, robots, twitter:*) or `property` (og:*). */
export type SeoTag =
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

/**
 * The head of one page: title, canonical URL and meta tags. The canonical URL always names the
 * production address (previews point search engines there); a page that is noindex itself (the
 * not-found page) has none.
 */
export interface SeoHead {
  readonly title: string;
  readonly canonical?: string;
  readonly tags: readonly SeoTag[];
}

/** Open Graph image size: `pnpm ds:og` renders it at 1200 × 630 and test:scripts checks it. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** The path part of a router URL: no query, no fragment, no trailing slash (Vercel's clean URLs). */
export function canonicalPath(url: string): string {
  const path = url.split(/[?#]/, 1)[0] ?? '';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * The page title, canonical URL, description, robots, Open Graph and Twitter tags for a page.
 * Pure, so the unit tests check the tags themselves and the prerender writes the same ones.
 * @param site The site settings for this build (previews come with `robots: noindex`).
 * @param page The route's title (before `titleTemplate`; none on the home page) and its `seo`.
 * @param url The router URL of the page.
 */
export function seoHead(
  site: ResolvedSite,
  page: { readonly title?: string; readonly seo?: PageSeo },
  url: string,
): SeoHead {
  const title = page.title ? site.titleTemplate.replace('%s', page.title) : site.name;
  const description = page.seo?.description ?? site.description;
  const robots = page.seo?.robots ?? site.robots;
  const path = canonicalPath(url);
  const pageUrl = `${site.url}${path === '/' ? '/' : path}`;

  const tags: SeoTag[] = [
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    { property: 'og:type', content: page.seo?.type ?? 'website' },
    { property: 'og:site_name', content: site.name },
    { property: 'og:locale', content: site.locale },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: pageUrl },
    { name: 'twitter:card', content: site.ogImage ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
  if (site.ogImage) {
    const image = `${site.url}/assets/${site.ogImage}`;
    const alt = site.ogImageAlt ?? site.name;
    tags.push(
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: image.endsWith('.png') ? 'image/png' : 'image/jpeg' },
      { property: 'og:image:width', content: String(OG_IMAGE_SIZE.width) },
      { property: 'og:image:height', content: String(OG_IMAGE_SIZE.height) },
      { property: 'og:image:alt', content: alt },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: alt },
    );
  }
  return { title, canonical: page.seo?.robots === 'noindex' ? undefined : pageUrl, tags };
}
