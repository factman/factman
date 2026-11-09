/**
 * The data files from PRD section 7. Each lives at `src/data/<name>.json` with its
 * JSON Schema at `src/data/schemas/<name>.schema.json`. A file is validated as soon
 * as it exists; until then it is simply not seeded yet.
 */
export const DATA_FILES = [
  'profile',
  'skills',
  'experience',
  'services',
  'projects',
  'blog',
  'contact',
  'resumes',
  'site',
  'clients',
] as const;

export type DataFileName = (typeof DATA_FILES)[number];

export const DATA_DIR = 'src/data';
export const SCHEMA_DIR = 'src/data/schemas';
/** Asset paths in the data (logo, cover, gallery, photo.src, …) are relative to this folder. */
export const ASSETS_DIR = 'src/assets';
