import type { Services } from '@shared';

import servicesJson from '../../data/services.json';

/** Services from `src/data/services.json` (schema-validated by `pnpm data:validate`). */
export const services = servicesJson as Services;
