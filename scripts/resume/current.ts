/** Each résumé as the data describes it now: its view model and the hash of its HTML. */
import {
  buildResumeViewModel,
  resumeIds,
  type ResumeViewModel,
} from '../../src/app/shared/resume/resume-view-model';

import type { CurrentResume } from './manifest';
import { sha256 } from './manifest';
import { loadResumeSources } from './sources';
import { renderResume } from './template';

export interface ResumeNow extends CurrentResume {
  vm: ResumeViewModel;
}

/** The HTML is hashed without the inlined fonts: they only change with the font packages. */
export function currentResumes(now: Date = new Date()): ResumeNow[] {
  const sources = loadResumeSources();
  return resumeIds(sources.resumes).map((id) => {
    const vm = buildResumeViewModel(id, sources, now);
    return {
      id,
      fileName: vm.fileName,
      pages: vm.pages,
      source: sha256(renderResume(vm)),
      unfilled: vm.unfilled.length,
      vm,
    };
  });
}
