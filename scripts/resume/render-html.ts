/**
 * Writes each résumé's HTML to dist/resumes/<file>.html (ETE-107), for review in a browser and as
 * the input of the PDF build (ETE-108). `pnpm resume:html`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildResumeViewModel, resumeIds } from '../../src/app/shared/resume/resume-view-model';

import { loadResumeSources } from './sources';
import { renderResume } from './template';

export const OUT_DIR = 'dist/resumes';

const sources = loadResumeSources();
mkdirSync(OUT_DIR, { recursive: true });
for (const id of resumeIds(sources.resumes)) {
  const vm = buildResumeViewModel(id, sources, new Date());
  const file = join(OUT_DIR, vm.fileName.replace(/\.pdf$/, '.html'));
  writeFileSync(file, renderResume(vm));
  console.log(
    `resume:html ${id} → ${file}${vm.unfilled.length ? ` (${vm.unfilled.length} placeholders to fill)` : ''}`,
  );
}
