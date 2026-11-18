import type { Clients } from '@shared';

import clientsJson from '../../data/clients.json';

/** Companies and clients from `src/data/clients.json` (schema-validated by `pnpm data:validate`). */
export const clients = clientsJson as Clients;
