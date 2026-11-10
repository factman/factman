import type { Contact } from '@shared';

import contactJson from '../../data/contact.json';

/** Contact details from `src/data/contact.json` (schema-validated by `pnpm data:validate`). */
export const contact = contactJson as Contact;
