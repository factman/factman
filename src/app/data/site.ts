import type { Site } from '@shared';

import siteJson from '../../data/site.json';

/**
 * Site settings from `src/data/site.json`. `pnpm data:validate` checks the file against its JSON
 * Schema before every build and test, so the cast to the generated type is safe.
 */
export const site = siteJson as Site;
