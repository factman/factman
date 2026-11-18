import type { Skills } from '@shared';

import skillsJson from '../../data/skills.json';

/** Skills from `src/data/skills.json` (schema-validated by `pnpm data:validate`). */
export const skills = skillsJson as Skills;
