import type { ResumeDownload } from '@shared';

/** Three résumés with their PDFs and page images, for the résumé organisms' specs and stories. */
export const RESUMES: ResumeDownload[] = ['fullstack', 'mobile', 'devops'].map((slug) => ({
  slug,
  title: `${slug} title`,
  scope: `${slug} scope`,
  icon: 'layout',
  fileName: `cv-${slug}.pdf`,
  file: `/resumes/cv-${slug}.pdf`,
  size: '63 KB',
  pages: 2,
  previews: [`/resumes/cv-${slug}-page-1.webp`, `/resumes/cv-${slug}-page-2.webp`],
  updated: 'Nov 2026',
}));
