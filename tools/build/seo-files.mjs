// sitemap.xml and robots.txt for the built site (ETE-113). Runs after `ng build` and the 404 page.
// The sitemap lists every prerendered page that has a canonical URL (the indexable ones: the
// not-found page has none), so it always matches the route list. robots.txt points to it in
// production and disallows everything on a preview (BUILD_VARIANT=preview).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { BUILD_VARIANT, DIST, TOOL_DIRS } from './inline-scripts.mjs';

const site = JSON.parse(readFileSync('src/data/site.json', 'utf8'));

/** Every prerendered index.html, outside the tool folders. */
function pages(dir = DIST) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return dir === DIST && TOOL_DIRS.includes(name) ? [] : pages(path);
    }
    return name === 'index.html' ? [path] : [];
  });
}

/** The canonical URLs of the built pages, sorted, without duplicates. */
export function canonicalUrls() {
  const urls = new Set();
  for (const file of pages()) {
    const href = readFileSync(file, 'utf8').match(
      /<link\s[^>]*rel="canonical"[^>]*href="([^"]+)"/,
    )?.[1];
    if (href) urls.add(href);
  }
  return [...urls].sort();
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function sitemap(urls) {
  const items = urls.map((u) => `  <url><loc>${escape(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function robots(variant = BUILD_VARIANT) {
  return variant === 'preview'
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const urls = canonicalUrls();
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap(urls));
  writeFileSync(join(DIST, 'robots.txt'), robots());
  console.log(
    `seo-files: ${urls.length} URLs in sitemap.xml; robots.txt for ${BUILD_VARIANT} (${relative('.', DIST).split(sep).join('/')})`,
  );
}
