import { resumeDownloads } from './resume-download';

const resume = (id: string) => ({
  id,
  slug: id,
  title: `${id} title`,
  scope: 'scope',
  icon: 'layout',
  fileName: `cv-${id}.pdf`,
});
const entry = (id: string) => ({
  id,
  file: `/resumes/cv-${id}.pdf`,
  bytes: 64_541,
  pages: 2,
  previews: [`/resumes/cv-${id}-page-1.webp`, `/resumes/cv-${id}-page-2.webp`],
});

describe('resumeDownloads', () => {
  it('joins each résumé with its committed PDF, in resumes.json order', () => {
    expect(
      resumeDownloads([resume('a'), resume('b')], [entry('b'), entry('a')], '2026-11-10'),
    ).toEqual([
      {
        slug: 'a',
        title: 'a title',
        scope: 'scope',
        icon: 'layout',
        fileName: 'cv-a.pdf',
        file: '/resumes/cv-a.pdf',
        size: '63 KB',
        pages: 2,
        previews: ['/resumes/cv-a-page-1.webp', '/resumes/cv-a-page-2.webp'],
        updated: 'Nov 2026',
      },
      expect.objectContaining({ slug: 'b' }),
    ]);
  });

  it('leaves out a résumé that has not been printed', () => {
    expect(resumeDownloads([resume('a'), resume('b')], [entry('a')], '2026-11-10')).toHaveLength(1);
  });
});
