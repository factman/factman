import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { provideIcons } from '@ui/atoms';
import { RESUME_ICONS } from '@ui/molecules';
import { expect, within } from 'storybook/test';

import { ResumeSection } from './resume-section';
import { RESUMES } from './resume-downloads.testing';

const real = (slug: string, title: string, icon: string) => ({
  ...RESUMES.find((r) => r.slug === slug)!,
  title,
  icon,
  previews: [`/resumes/odunayo-mohammed-${slug}-page-1.webp`],
});

/**
 * The résumé block inside About (#resume): a card per résumé with its first page, Preview and
 * Download. The page opens ResumePreviewModal or downloads the PDF.
 */
const meta: Meta<ResumeSection> = {
  title: 'Organisms/ResumeSection',
  component: ResumeSection,
  decorators: [applicationConfig({ providers: [provideIcons(RESUME_ICONS)] })],
  args: {
    resumes: [
      real('fullstack', 'Fullstack Software Engineer', 'layout'),
      real('mobile', 'Mobile Developer', 'mobile'),
      real('devops', 'DevOps / Cloud Engineer', 'cloud'),
    ],
  },
};
export default meta;

type Story = StoryObj<ResumeSection>;

export const Three: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button', { name: /^Preview / })).toHaveLength(3);
  },
};
