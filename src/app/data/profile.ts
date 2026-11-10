import type { Profile } from '@shared';

import profileJson from '../../data/profile.json';

/** The owner's profile from `src/data/profile.json` (schema-validated by `pnpm data:validate`). */
export const profile = profileJson as Profile;
