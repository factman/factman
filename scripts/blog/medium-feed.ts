/**
 * Medium RSS → blog.json posts (ETE-32, ETE-102). Pure functions, unit-tested with a sample feed;
 * the network and file work is in sync-medium.ts.
 */

/** One post in src/data/blog.json (see src/data/schemas/blog.schema.json). */
export interface BlogPost {
  id: string;
  url: string;
  title: string;
  publishedAt: string;
  tags: string[];
  excerpt: string;
  cover?: string;
  readingMinutes: number;
  origin: 'manual' | 'rss';
}

/** One `<item>` of the feed, before it becomes a post. */
export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
  content: string;
}

export const FEED_URL = 'https://medium.com/feed/@factman60';
/** The longest excerpt blog.json accepts (DS-10). */
export const EXCERPT_MAX = 280;
/** Typical adult silent reading speed, words per minute; Medium uses about the same. */
export const WORDS_PER_MINUTE = 238;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Decodes named and numeric HTML entities. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Text of an HTML fragment: tags removed, entities decoded, whitespace collapsed. */
export const htmlToText = (html: string): string =>
  decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

/** A tag's text, unwrapping CDATA; empty when the tag is missing. */
function tagText(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml);
  if (!match) return '';
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(match[1]);
  return cdata ? cdata[1] : decodeEntities(match[1].trim());
}

/** The `<item>`s of an RSS 2.0 feed (Medium's shape: CDATA titles, categories and content). */
export function parseFeed(xml: string): FeedItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    title: tagText(item, 'title'),
    link: tagText(item, 'link'),
    pubDate: tagText(item, 'pubDate'),
    categories: [...item.matchAll(/<category>([\s\S]*?)<\/category>/g)].map(([, c]) =>
      tagText(`<category>${c}</category>`, 'category'),
    ),
    content: tagText(item, 'content:encoded'),
  }));
}

/** `https://medium.com/@factman60/some-title-1a2b3c4d5e6f?source=rss` → `https://medium.com/@factman60/some-title-1a2b3c4d5e6f`. */
export const canonicalUrl = (link: string): string => link.split(/[?#]/)[0];

/** The post's id: its Medium slug without the trailing 12-character hash. */
export function postId(link: string): string {
  const slug = canonicalUrl(link).split('/').filter(Boolean).pop() ?? '';
  return slug.replace(/-[0-9a-f]{8,16}$/, '').toLowerCase();
}

/** The first paragraph's text, cut at a word to at most `max` characters with an ellipsis. */
export function excerptOf(html: string, max = EXCERPT_MAX): string {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(([, p]) => htmlToText(p));
  const text = paragraphs.find((p) => p.length > 0) ?? htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const end = cut.lastIndexOf(' ');
  return `${(end > max / 2 ? cut.slice(0, end) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** Whole minutes to read the content, at least 1. */
export const readingMinutesOf = (html: string): number =>
  Math.max(1, Math.ceil(htmlToText(html).split(' ').filter(Boolean).length / WORDS_PER_MINUTE));

/** The first image in the content, the cover Medium shows. */
export const coverUrlOf = (html: string): string | undefined =>
  /<img[^>]+src="([^"]+)"/.exec(html)?.[1];

/** Tags as kebab-case slugs (Medium's categories already are), without repeats. */
const toTags = (categories: string[]): string[] => [
  ...new Set(
    categories
      .map((c) =>
        c
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      )
      .filter(Boolean),
  ),
];

/** A feed item as a blog.json post. `cover` is set later, once the image is stored locally. */
export function toPost(item: FeedItem): BlogPost {
  const published = new Date(item.pubDate);
  if (Number.isNaN(published.getTime()))
    throw new Error(`Bad pubDate "${item.pubDate}" for ${item.link}`);
  return {
    id: postId(item.link),
    url: canonicalUrl(item.link),
    title: decodeEntities(item.title).trim(),
    publishedAt: published.toISOString(),
    tags: toTags(item.categories),
    excerpt: excerptOf(item.content),
    readingMinutes: readingMinutesOf(item.content),
    origin: 'rss',
  };
}

/**
 * Merges synced posts into blog.json: manual posts are kept as they are, a synced post replaces the
 * stored post with the same id (the feed is newer), and older synced posts that dropped out of the
 * feed (it only lists the latest few) are kept. Newest first.
 */
export function mergePosts(
  existing: readonly BlogPost[],
  incoming: readonly BlogPost[],
): BlogPost[] {
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const post of incoming) {
    const old = byId.get(post.id);
    if (old?.origin === 'manual') continue;
    byId.set(post.id, { ...post, ...(old?.cover && !post.cover ? { cover: old.cover } : {}) });
  }
  return [...byId.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
