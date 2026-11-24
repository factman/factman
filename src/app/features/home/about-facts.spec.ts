import { aboutFacts, yearRange } from './about-facts';

const profile = {
  education: [
    { title: 'Older course', institution: 'A school', start: 2008, end: 2010 },
    {
      title: 'Computer Software Engineering',
      institution: 'FirstMark Innovation School of Technology',
      start: 2013,
      end: 2015,
    },
  ],
  languages: [
    { name: 'English', proficiency: 'Spoken and written', level: 'Professional working' },
    { name: 'Yoruba', proficiency: 'Spoken and written', level: 'Native' },
  ],
  publications: [
    { title: 'Coronavirus Daily Update', kind: 'mobile app', year: 2020, description: '' },
    { title: 'GraphUI', kind: 'open source', year: 2019, description: '' },
  ],
};

describe('yearRange', () => {
  it('formats a range, one year, or an open end', () => {
    expect(yearRange(2013, 2015)).toBe('2013 – 2015');
    expect(yearRange(2020, 2020)).toBe('2020');
    expect(yearRange(2024)).toBe('2024 – Present');
  });
});

describe('aboutFacts', () => {
  it('builds the education, languages and publications tiles from the profile', () => {
    expect(aboutFacts(profile).map(({ label, title, meta }) => ({ label, title, meta }))).toEqual([
      {
        label: 'Education',
        title: 'Computer Software Engineering',
        meta: 'FirstMark Innovation School of Technology · 2013 – 2015',
      },
      { label: 'Languages', title: 'English, Yoruba', meta: 'Spoken and written' },
      {
        label: 'Publications',
        title: 'Coronavirus Daily Update, GraphUI',
        meta: 'Mobile app, open source · 2019 – 2020',
      },
    ]);
  });

  it('leaves out a tile whose list is empty', () => {
    const facts = aboutFacts({ education: [], languages: profile.languages, publications: [] });
    expect(facts.map((f) => f.label)).toEqual(['Languages']);
  });
});
