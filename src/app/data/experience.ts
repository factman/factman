import type { Experience } from '@shared';

import experienceJson from '../../data/experience.json';

/** Work history from `src/data/experience.json` (schema-validated by `pnpm data:validate`). */
export const experience = experienceJson as Experience;
