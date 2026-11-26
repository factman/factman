import { type Meta, type StoryObj, applicationConfig } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { provideIcons } from '@ui/atoms/icon/icon-registry';
import { iconCloud, iconLayout, iconMobile } from '@ui/atoms/icon/icons';

import { ResumeCard } from './resume-card';

/** One résumé variant with Preview and Download (FR-43). */
const meta: Meta<ResumeCard> = {
  title: 'Molecules/ResumeCard',
  component: ResumeCard,
  decorators: [
    applicationConfig({ providers: [provideIcons([iconLayout, iconMobile, iconCloud])] }),
  ],
  args: {
    resume: {
      slug: 'fullstack',
      title: 'Fullstack Software Engineer',
      scope: 'Frontend and backend development for product and engineering roles.',
      icon: 'layout',
      fileName: 'odunayo-mohammed-fullstack.pdf',
      photo: '/assets/profile/odunayo-resume-fullstack-360.webp',
      pages: 2,
      size: '186 KB',
      updated: 'Nov 2026',
    },
    preview: fn(),
    download: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 320px"><fm-resume-card [resume]="resume" (preview)="preview($event)" (download)="download($event)" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<ResumeCard>;

export const Fullstack: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Preview/ }));
    await expect(args.preview).toHaveBeenCalled();
  },
};

export const DevOps: Story = {
  args: {
    resume: {
      slug: 'devops',
      title: 'DevOps / Cloud Engineer',
      scope: 'Docker, Kubernetes, AWS, GCP and Azure for platform and cloud roles.',
      icon: 'cloud',
      fileName: 'odunayo-mohammed-devops.pdf',
      photo: '/assets/profile/odunayo-resume-devops-360.webp',
      pages: 2,
      size: '179 KB',
      updated: 'Nov 2026',
    },
  },
};
