import { site } from '@data/site';
import { type ResolvedSite, resolveSite } from '@shared';

import { canonicalPath, seoHead, type SeoTag } from './page-seo';

const production = resolveSite(site, 'production');
const preview = resolveSite(site, 'preview');

/** The tags as `{ key: content }`, keyed by name or property. */
const byKey = (tags: readonly SeoTag[]) =>
  Object.fromEntries(tags.map((t) => ['name' in t ? t.name : t.property, t.content]));

describe('seoHead', () => {
  it('titles the home page with the site name and other pages through the template', () => {
    expect(seoHead(production, {}, '/').title).toBe('Odunayo Mohammed');
    expect(seoHead(production, { title: 'Blog' }, '/blog').title).toBe('Blog · Odunayo Mohammed');
  });

  it('writes description, Open Graph and Twitter tags, with the image, its size and alt', () => {
    const tags = byKey(
      seoHead(production, { title: 'Blog', seo: { description: 'Articles.' } }, '/blog').tags,
    );
    expect(tags).toEqual({
      description: 'Articles.',
      robots: production.robots,
      'og:type': 'website',
      'og:site_name': 'Odunayo Mohammed',
      'og:locale': 'en_NG',
      'og:title': 'Blog · Odunayo Mohammed',
      'og:description': 'Articles.',
      'og:url': 'https://www.factman.dev/blog',
      'og:image': 'https://www.factman.dev/assets/og/default.jpg',
      'og:image:type': 'image/jpeg',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': site.ogImageAlt,
      'twitter:card': 'summary_large_image',
      'twitter:title': 'Blog · Odunayo Mohammed',
      'twitter:description': 'Articles.',
      'twitter:image': 'https://www.factman.dev/assets/og/default.jpg',
      'twitter:image:alt': site.ogImageAlt,
    });
  });

  it('falls back to the site description, and a summary card without an image', () => {
    const bare: ResolvedSite = { ...production, ogImage: undefined };
    const tags = byKey(seoHead(bare, {}, '/').tags);
    expect(tags['description']).toBe(site.description);
    expect(tags['twitter:card']).toBe('summary');
    expect(tags['og:image']).toBeUndefined();
  });

  it('points the canonical URL at production, without query, fragment or trailing slash', () => {
    expect(seoHead(preview, {}, '/').canonical).toBe('https://www.factman.dev/');
    expect(seoHead(preview, {}, '/projects/graphui/?ref=x#top').canonical).toBe(
      'https://www.factman.dev/projects/graphui',
    );
  });

  it('is noindex on previews, and on noindex pages with no canonical URL', () => {
    expect(byKey(seoHead(preview, {}, '/').tags)['robots']).toBe('noindex');
    const index: ResolvedSite = { ...production, robots: 'index' };
    expect(byKey(seoHead(index, {}, '/').tags)['robots']).toBe('index');
    const notFound = seoHead(index, { seo: { robots: 'noindex' } }, '/404');
    expect(byKey(notFound.tags)['robots']).toBe('noindex');
    expect(notFound.canonical).toBeUndefined();
  });
});

describe('canonicalPath', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['/blog/', '/blog'],
    ['/blog?x=1', '/blog'],
    ['/blog#top', '/blog'],
  ])('%j → %s', (url, path) => expect(canonicalPath(url)).toBe(path));
});
