/**
 * `pnpm sync:medium` (ETE-32, ETE-102): reads the Medium feed, adds or updates the synced posts in
 * src/data/blog.json and stores each cover locally as WebP under src/assets/blog (no hotlinking).
 * Manual posts are never changed. Idempotent: with nothing new it writes nothing and says so.
 * Run `pnpm data:validate` afterwards (the weekly workflow in ETE-102 does both).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { type BlogPost, FEED_URL, coverUrlOf, mergePosts, parseFeed, toPost } from './medium-feed';

export const BLOG_FILE = 'src/data/blog.json';
export const COVER_DIR = 'src/assets/blog';
/** Covers are stored at most this wide; Medium serves them at 1024 px. */
export const COVER_WIDTH = 1200;
const USER_AGENT = 'factman-portfolio sync:medium';

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res;
}

/** Downloads a cover once and converts it to WebP; returns its path relative to src/assets. */
async function storeCover(root: string, id: string, url: string): Promise<string> {
  const rel = `blog/${id}.webp`;
  const out = join(root, COVER_DIR, `${id}.webp`);
  if (existsSync(out)) return rel;
  const image = Buffer.from(await (await fetchOk(url)).arrayBuffer());
  mkdirSync(join(root, COVER_DIR), { recursive: true });
  await sharp(image)
    .resize({ width: COVER_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  return rel;
}

export async function syncMedium(
  root: string,
  feedXml?: string,
): Promise<{ changed: boolean; posts: BlogPost[] }> {
  const xml = feedXml ?? (await (await fetchOk(FEED_URL)).text());
  const items = parseFeed(xml);
  if (!items.length) throw new Error(`No posts in ${FEED_URL}; the feed may have changed shape`);

  const incoming: BlogPost[] = [];
  for (const item of items) {
    const post = toPost(item);
    const cover = coverUrlOf(item.content);
    incoming.push(cover ? { ...post, cover: await storeCover(root, post.id, cover) } : post);
  }

  const file = join(root, BLOG_FILE);
  const existing: BlogPost[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const posts = mergePosts(existing, incoming);
  const next = `${JSON.stringify(posts, null, 2)}\n`;
  const changed = !existsSync(file) || readFileSync(file, 'utf8') !== next;
  if (changed) writeFileSync(file, next);
  return { changed, posts };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  syncMedium(process.cwd()).then(
    ({ changed, posts }) =>
      console.log(
        changed
          ? `sync:medium: ${posts.length} posts in ${BLOG_FILE}`
          : `sync:medium: no changes (${posts.length} posts)`,
      ),
    (e) => {
      console.error(`sync:medium failed: ${(e as Error).message}`);
      process.exit(1);
    },
  );
}
