/** The résumé's sources (ResumeSources) read from src/data, for the template and the PDF build. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ResumeSources } from '../../src/app/shared/resume/resume-view-model';

const read = <T>(root: string, name: string): T =>
  JSON.parse(readFileSync(join(root, 'src/data', `${name}.json`), 'utf8')) as T;

export function loadResumeSources(root = '.'): ResumeSources {
  return {
    resumes: read(root, 'resumes'),
    profile: read(root, 'profile'),
    contact: read(root, 'contact'),
    site: read(root, 'site'),
    experience: read(root, 'experience'),
    skills: read(root, 'skills'),
    projects: read(root, 'projects'),
    clients: read(root, 'clients'),
  };
}
