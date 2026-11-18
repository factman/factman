import type { Projects } from '@shared';

import projectsJson from '../../data/projects.json';

/** Projects from `src/data/projects.json` (schema-validated by `pnpm data:validate`). */
export const projects = projectsJson as Projects;
