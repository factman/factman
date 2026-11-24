/**
 * Medium RSS → blog posts (ETE-32, ETE-102). The site reads the feed live in the browser (no
 * snapshot at build time); these pure functions turn it into posts. Unit-tested with a sample feed.
 */

/** One article from the Medium feed. */
export interface BlogPost {
  readonly id: string;
  /** Canonical Medium URL, without the tracking query. */
  readonly url: string;
  readonly title: string;
  /** ISO date-time. */
  readonly publishedAt: string;
  readonly tags: readonly string[];
  /** First paragraph, at most 280 characters. */
  readonly excerpt: string;
  /** Live Medium image URL (the first image in the article); never copied to the site. */
  readonly cover?: string;
  readonly readingMinutes: number;
}

/** One `<item>` of the feed, before it becomes a post. */
export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
  content: string;
}

/** The longest excerpt shown on a post card. */
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

/** Elements whose text is never article prose. */
const NOT_PROSE = 'script, style, noscript, template, iframe, object, svg';

/**
 * The Trusted Types policy for parsing feed HTML (listed in the CSP's `trusted-types`). It only
 * feeds DOMParser, whose document is inert and is read for text and one image URL; nothing from
 * it is ever put in the page, so it passes the string through.
 */
export const FEED_HTML_POLICY = 'fm-feed-html';

interface HtmlPolicy {
  createHTML(input: string): unknown;
}
interface TrustedTypesFactory {
  createPolicy(name: string, rules: { createHTML(input: string): string }): HtmlPolicy;
}

/** null: no Trusted Types; false: the CSP refused the policy; else the policy (one per window). */
const policies = new WeakMap<TrustedTypesFactory, HtmlPolicy | false>();

function feedHtml(html: string): string | false {
  const factory = (globalThis as { trustedTypes?: TrustedTypesFactory }).trustedTypes;
  if (!factory) return html;
  if (!policies.has(factory)) {
    try {
      policies.set(factory, factory.createPolicy(FEED_HTML_POLICY, { createHTML: (s) => s }));
    } catch {
      policies.set(factory, false);
    }
  }
  const policy = policies.get(factory);
  return policy ? (policy.createHTML(html) as string) : false;
}

/**
 * The fragment as an inert document (ETE-270): the platform's HTML parser, so attributes that
 * contain `>`, comments and odd quoting are read correctly, and nothing in it runs or loads.
 * Null without DOMParser (or when Trusted Types refuses the parse); callers then fall back to
 * string handling.
 */
function parseHtml(html: string): Document | null {
  if (typeof DOMParser === 'undefined') return null;
  const trusted = feedHtml(html);
  if (trusted === false) return null;
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(trusted, 'text/html');
  } catch {
    return null;
  }
  doc.querySelectorAll(NOT_PROSE).forEach((el) => el.remove());
  return doc;
}

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** Text of an HTML fragment: tags removed, entities decoded, whitespace collapsed. */
export function htmlToText(html: string): string {
  const doc = parseHtml(html);
  if (doc) return collapse(doc.body.textContent ?? '');
  return collapse(decodeEntities(html.replace(/<[^>]+>/g, ' ')));
}

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
  const doc = parseHtml(html);
  const paragraphs = doc
    ? [...doc.querySelectorAll('p')].map((p) => collapse(p.textContent ?? ''))
    : [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(([, p]) => htmlToText(p));
  const text = paragraphs.find((p) => p.length > 0) ?? htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const end = cut.lastIndexOf(' ');
  return `${(end > max / 2 ? cut.slice(0, end) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** Whole minutes to read the content, at least 1. */
export const readingMinutesOf = (html: string): number =>
  Math.max(1, Math.ceil(htmlToText(html).split(' ').filter(Boolean).length / WORDS_PER_MINUTE));

/** The first image in the content, the cover Medium shows; only an https URL is used. */
export function coverUrlOf(html: string): string | undefined {
  const doc = parseHtml(html);
  const src = doc
    ? doc.querySelector('img[src]')?.getAttribute('src')
    : /<img[^>]+src=["']([^"']+)["']/.exec(html)?.[1];
  return src && /^https:\/\//i.test(src.trim()) ? src.trim() : undefined;
}

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

/** A feed item as a post, with its live Medium cover URL. */
export function toPost(item: FeedItem): BlogPost {
  const published = new Date(item.pubDate);
  if (Number.isNaN(published.getTime()))
    throw new Error(`Bad pubDate "${item.pubDate}" for ${item.link}`);
  const cover = coverUrlOf(item.content);
  return {
    id: postId(item.link),
    url: canonicalUrl(item.link),
    title: decodeEntities(item.title).trim(),
    publishedAt: published.toISOString(),
    tags: toTags(item.categories),
    excerpt: excerptOf(item.content),
    readingMinutes: readingMinutesOf(item.content),
    ...(cover ? { cover } : {}),
  };
}

/**
 * Every valid post in a feed, newest first. An item without a usable date is skipped rather than
 * failing the whole list, so one odd post never empties the blog.
 */
export function postsFromFeed(xml: string): BlogPost[] {
  return parseFeed(xml)
    .flatMap((item) => {
      try {
        return [toPost(item)];
      } catch {
        return [];
      }
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
