import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

import { iconBookOpen, iconGlobe, iconGraduationCap } from '@ui/atoms';

import { AboutSection } from './about-section';

/**
 * The About section's body (FR-10): the framed portrait with the ODUNAYO plate, the first-person
 * story and the education, languages and publications tiles. The page wraps it in SectionLayout
 * (`#about`) and projects the résumé block after it.
 */
const meta: Meta<AboutSection> = {
  title: 'Organisms/AboutSection',
  component: AboutSection,
  parameters: { layout: 'padded' },
  args: {
    story: [
      'I started writing software professionally in 2013 and have spent the years since building web, mobile and payment products for startups and growing companies in Nigeria and beyond.',
      'Today I am CTO at Simple Finance, where I lead the technology team and strategy, and co-founder of ETeam Technology, where I have overseen architecture, quality and delivery since 2017. Before that I led frontend engineering at Mazadat in Cairo.',
      'I care about clean architecture, fast and accessible interfaces, and teams that ship every week without burning out.',
    ],
    photo: {
      src: '/assets/profile/odunayo-about.webp',
      alt: 'Odunayo Mohammed in a three-quarter view, smiling, arms crossed',
      width: 720,
      height: 900,
      sources: {
        avif: '/assets/profile/odunayo-about-360.avif 360w, /assets/profile/odunayo-about-540.avif 540w, /assets/profile/odunayo-about-720.avif 720w',
        webp: '/assets/profile/odunayo-about-360.webp 360w, /assets/profile/odunayo-about-540.webp 540w, /assets/profile/odunayo-about-720.webp 720w',
      },
      sizes: '(min-width: 768px) 480px, 360px',
    },
    facts: [
      {
        icon: iconGraduationCap,
        label: 'Education',
        title: 'Computer Software Engineering',
        meta: 'FirstMark Innovation School of Technology · 2013 – 2015',
      },
      {
        icon: iconGlobe,
        label: 'Languages',
        title: 'English, Yoruba',
        meta: 'Spoken and written',
      },
      {
        icon: iconBookOpen,
        label: 'Publications',
        title: 'Coronavirus Daily Update, Covid-19 Daily Update API, GraphUI',
        meta: 'Mobile app, open source · 2019 – 2020',
      },
    ],
    theme: 'light',
  },
};
export default meta;

type Story = StoryObj<AboutSection>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.getByRole('img', { name: /three-quarter view/ })).toBeVisible();
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile' } } };

/** The plate's logo artwork follows the theme. */
export const Dark: Story = { args: { theme: 'dark' }, globals: { theme: 'dark' } };

/** Without a photo the story and tiles take the full width. */
export const NoPhoto: Story = { args: { photo: undefined } };
