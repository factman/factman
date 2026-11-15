import { buildResumeViewModel, plainText, type ResumeSources, type RichText } from '@shared';

import { clients } from './clients';
import { contact } from './contact';
import { experience } from './experience';
import { profile } from './profile';
import { projects } from './projects';
import { resumes } from './resumes';
import { site } from './site';
import { skills } from './skills';

// ETE-34: the three résumés on canvas page 06, built only from the data files.
const NOW = new Date('2026-11-15T12:00:00Z');
const sources: ResumeSources = {
  resumes,
  profile,
  contact,
  site,
  experience,
  skills,
  projects,
  clients,
};
const build = (id: string, from: ResumeSources = sources) => buildResumeViewModel(id, from, NOW);
const plain = (texts: readonly RichText[]) => texts.map(plainText);

describe('résumé view model (canvas page 06)', () => {
  it('builds the shared header, closing sections and footer from profile, contact and site', () => {
    const cv = build('fullstack');
    expect(cv.header.name).toBe('Odunayo Mohammed');
    expect(cv.header.headline).toBe('Fullstack Software Engineer · CTO');
    expect(cv.header.contact.map((line) => line.map((c) => c.text))).toEqual([
      ['Lagos, Nigeria', '+234 706 678 0373', 'factman60@gmail.com'],
      ['linkedin.com/in/mohammed-odunayo', 'github.com/factman', 'factman.vercel.app'],
    ]);
    expect(cv.education).toEqual([
      {
        title: 'Computer Software Engineering',
        institution: 'FirstMark Innovation School of Technology',
        dates: '2013 – 2015',
      },
    ]);
    expect(cv.languages).toEqual([
      { name: 'English', level: 'Professional working' },
      { name: 'Yoruba', level: 'Native' },
    ]);
    expect(cv.publications.map((p) => `${p.title} · ${p.meta}`)).toEqual([
      'Coronavirus Daily Update · mobile app, 2020',
      'Covid-19 Daily Update API · open source, 2020',
      'GraphUI · open source, 2019',
    ]);
    expect(cv.press).toEqual(['Nigerian engineer launches Coronavirus Daily Update mobile app']);
    expect(cv.footer).toBe('Odunayo Mohammed · Fullstack Software Engineer');
    expect(cv.fileName).toBe('odunayo-mohammed-fullstack.pdf');
    expect(cv.pages).toEqual({ target: 2, max: 3 });
  });

  it('derives companies and clients: clients.json minus employers, clients before companies', () => {
    expect(build('fullstack').clients).toEqual([
      'SunTrust Bank',
      'Gifti App',
      'AirtimeFlip',
      'Appiawave',
      'Internopay',
      'Circo',
      'Cloudax',
    ]);
  });

  it('computes the years in the summary instead of storing them', () => {
    expect(plainText(build('fullstack').summary)).toMatch(
      /^Fullstack software engineer and technology leader with 13\+ years of experience/,
    );
    expect(plainText(build('mobile').summary)).toContain(
      'cross-platform mobile experience since 2018,',
    );
  });

  it('Fullstack: skills, experience order, legal names, stacks and earlier roles', () => {
    const cv = build('fullstack');
    expect(cv.skillGroups.map((g) => g.label)).toEqual([
      'Languages',
      'Frontend',
      'Backend & APIs',
      'Data',
      'Cloud & delivery',
      'Leadership',
    ]);
    expect(plain(cv.skillGroups[0].items)).toEqual([
      'TypeScript',
      'JavaScript (ES6+)',
      'PHP',
      'Python',
      'Java',
      'C++',
      'SQL',
    ]);
    expect(cv.experience.map((o) => o.organization)).toEqual([
      'Simple Finance Company Limited',
      'ETeam Technology',
      'Mazadat',
      'Travoofy',
      'Investa.ng',
      '386konsult',
    ]);
    const [simpleFinance, eteam] = cv.experience;
    expect(simpleFinance.jobs.map((j) => j.dates)).toEqual([
      'Jan 2024 – Present',
      'Dec 2021 – Jan 2023',
    ]);
    expect(simpleFinance.jobs[0].bullets).toHaveLength(4);
    expect(plain(simpleFinance.stack)).toEqual([
      'Angular',
      'Node.js',
      'TypeScript',
      'PostgreSQL',
      'Cloud',
    ]);
    expect(plainText(eteam.jobs[0].bullets[1])).toBe(
      'Lead a team of [N engineers] building web, mobile and payment products for clients including SunTrust Bank, Gifti App and AirtimeFlip.',
    );
    expect(cv.experience[4].jobs[0].title).toBe('Engineering Manager');
    expect(cv.earlier).toEqual([
      {
        title: 'Information Technology Support Specialist',
        organization: 'Afe Babalola University',
        dates: '2018 – Oct 2020',
        note: 'Hardware, software and systems support for faculty, staff and students; evaluated and deployed new systems with vendors.',
      },
      expect.objectContaining({ organization: 'Peace Mass Transit', dates: 'Jul 2020 – Aug 2020' }),
      expect.objectContaining({
        organization: 'Nano Blockchain Ltd',
        dates: 'Jun 2018 – Nov 2018',
      }),
      expect.objectContaining({ organization: 'JIT Solutions', dates: 'Jan 2013 – Dec 2017' }),
    ]);
    expect(cv.projects.map((p) => plainText(p.name))).toEqual([
      'Factman portfolio',
      'Covid-19 Daily Update API',
      'GraphUI',
    ]);
    // A project without overrides falls back to projects.json: no placeholder needed.
    expect(plainText(cv.projects[2].description)).toBe(
      projects.find((p) => p.id === 'graphui')?.summary,
    );
    expect(plain(cv.projects[2].tech)).toEqual(['JavaScript', 'CSS3']);
  });

  it('Mobile: leads with ETeam, merges the Mazadat roles and shows skill start years', () => {
    const cv = build('mobile');
    expect(cv.header.headline).toBe('Mobile Developer · React Native · Flutter · Ionic');
    expect(plain(cv.skillGroups[0].items)).toEqual([
      'React Native',
      'Flutter (since 2023)',
      'Ionic (since 2018)',
      'Android and iOS builds',
    ]);
    expect(cv.experience.map((o) => o.organization)).toEqual([
      'ETeam Technology',
      'Simple Finance Company Limited',
      'Mazadat',
      'Travoofy',
      'Investa.ng',
    ]);
    const mazadat = cv.experience[2].jobs;
    expect(mazadat).toHaveLength(1);
    expect(mazadat[0].title).toBe('Frontend Lead Engineer · Senior Frontend Engineer');
    expect(mazadat[0].dates).toBe('Apr 2023 – Mar 2024');
    expect(mazadat[0].bullets).toHaveLength(2);
    expect(cv.earlier.map((r) => r.organization)).toEqual([
      '386konsult',
      'Afe Babalola University',
      'Peace Mass Transit',
      'Nano Blockchain Ltd',
      'JIT Solutions',
    ]);
    expect(cv.earlier[0].note).toBeUndefined();
    expect(plainText(cv.projects[2].name)).toBe('[Client app name]');
  });

  it('DevOps: gives ABUAD a full entry and leaves 386konsult out', () => {
    const cv = build('devops');
    expect(cv.experience.map((o) => o.organization)).toEqual([
      'Simple Finance Company Limited',
      'ETeam Technology',
      'Mazadat',
      'Afe Babalola University',
      'Travoofy',
      'Investa.ng',
    ]);
    expect(cv.experience[3]).toMatchObject({
      location: 'Ado-Ekiti, Nigeria',
      jobs: [{ title: 'Information Technology Support Specialist', dates: '2018 – Oct 2020' }],
    });
    expect(JSON.stringify(cv)).not.toContain('386konsult');
    expect(cv.projects.map((p) => plainText(p.name))).toEqual([
      'Factman portfolio pipeline',
      'Ubuntu Server Setup',
      'Covid-19 Daily Update API',
    ]);
  });

  it('highlights unfilled placeholders and fills those with a value', () => {
    expect(build('fullstack').unfilled).toContain('[N customers]');
    const filled: ResumeSources = {
      ...sources,
      resumes: {
        ...resumes,
        placeholders: resumes.placeholders.map((p) =>
          p.token === '[N engineers]' ? { ...p, value: '12 engineers' } : p,
        ),
      },
    };
    const cv = build('fullstack', filled);
    const bullet = cv.experience[1].jobs[0].bullets[1];
    expect(plainText(bullet)).toContain('Lead a team of 12 engineers building');
    expect(bullet.find((s) => s.placeholder)?.placeholder).toEqual({
      token: '[N engineers]',
      filled: true,
    });
    expect(cv.unfilled).not.toContain('[N engineers]');
  });

  it('never includes a street address (RS-06)', () => {
    for (const id of ['fullstack', 'mobile', 'devops']) {
      const json = JSON.stringify(build(id));
      expect(json).not.toMatch(/street|address/i);
    }
  });
});
