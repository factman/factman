import { resumeDownloads as join } from '@shared';

import manifest from '../../../public/resumes/resumes.manifest.json';
import { profile } from './profile';
import { resumes } from './resumes';

/**
 * The résumés to preview and download (FR-43 to FR-46): resumes.json joined with the PDFs that
 * `pnpm build:resumes` committed to public/resumes/ (every build checks they are current).
 */
export const resumeDownloads = join(resumes.resumes, manifest.resumes, profile.updatedAt);
