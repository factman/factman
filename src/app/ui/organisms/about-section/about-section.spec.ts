import { render, screen, within } from '@testing-library/angular';

import { iconGlobe, iconGraduationCap } from '@ui/atoms/icon/icons';

import { type AboutFact, AboutSection } from './about-section';

const story = ['I started writing software in 2013.', 'Today I am CTO at Simple Finance.'];
const photo = {
  src: '/assets/profile/odunayo-about.webp',
  alt: 'Odunayo Mohammed in a three-quarter view',
  width: 720,
  height: 900,
  sources: { avif: '/a-360.avif 360w', webp: '/a-360.webp 360w' },
};
const facts: AboutFact[] = [
  {
    icon: iconGraduationCap,
    label: 'Education',
    title: 'Computer Software Engineering',
    meta: '2013 – 2015',
  },
  { icon: iconGlobe, label: 'Languages', title: 'English, Yoruba' },
];

describe('AboutSection', () => {
  it('tells the story, one paragraph per item', async () => {
    const { container } = await render(AboutSection, { inputs: { story, photo, facts } });
    const paragraphs = [...container.querySelectorAll('.about-section-story p')];
    expect(paragraphs.map((p) => p.textContent)).toEqual(story);
  });

  it('shows the portrait with its alt text and the ODUNAYO plate', async () => {
    await render(AboutSection, { inputs: { story, photo, facts } });
    expect(screen.getByRole('img', { name: photo.alt })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Odunayo' })).toBeTruthy();
  });

  it('lists the facts as tiles with their label, title and meta', async () => {
    await render(AboutSection, { inputs: { story, photo, facts } });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Education')).toBeTruthy();
    expect(within(items[0]).getByText('Computer Software Engineering')).toBeTruthy();
    expect(within(items[0]).getByText('2013 – 2015')).toBeTruthy();
    expect(within(items[1]).getByText('English, Yoruba')).toBeTruthy();
  });

  it('takes the full width without a photo, and leaves out an empty fact list', async () => {
    const { container } = await render(AboutSection, { inputs: { story } });
    expect(container.querySelector('.about-section')!.classList).toContain('no-photo');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('places projected content (the résumé) after the split', async () => {
    await render(
      `<fm-about-section [story]="story"><div id="resume">Résumé</div></fm-about-section>`,
      { imports: [AboutSection], componentProperties: { story } },
    );
    expect(document.getElementById('resume')!.textContent).toBe('Résumé');
  });
});
