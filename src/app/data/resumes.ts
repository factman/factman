import type { Resumes } from '@shared';

import resumesJson from '../../data/resumes.json';

/**
 * Résumé definitions from `src/data/resumes.json`. JSON imports widen `"A4"` to string and the
 * résumé list to a plain array, so this goes through `unknown`; `pnpm data:validate` checks the
 * file against its schema before every build and test.
 */
export const resumes = resumesJson as unknown as Resumes;
