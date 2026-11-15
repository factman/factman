import type { Blog } from '@shared';

import blogJson from '../../data/blog.json';

/** Blog posts from `src/data/blog.json`, synced from Medium (schema-validated by `pnpm data:validate`). */
export const blog = blogJson as Blog;
