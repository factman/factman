import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';

import { RESUMES } from '../resume-section/resume-downloads.testing';
import { ResumePreviewModal } from './resume-preview-modal';

const real = RESUMES.map((r, i) => ({
  ...r,
  title: ['Fullstack Software Engineer', 'Mobile Developer', 'DevOps / Cloud Engineer'][i],
  fileName: `odunayo-mohammed-${r.slug}.pdf`,
  file: `/resumes/odunayo-mohammed-${r.slug}.pdf`,
  previews: [1, 2].map((p) => `/resumes/odunayo-mohammed-${r.slug}-page-${p}.webp`),
}));

/**
 * The résumé preview (FR-44 to FR-46): tabs for each résumé, its pages as images, "Open PDF in new
 * tab" and Download, in the shared Dialog (focus trap, Escape, focus return).
 */
const meta: Meta<ResumePreviewModal> = {
  title: 'Organisms/ResumePreviewModal',
  component: ResumePreviewModal,
  args: { open: true, resumes: real, variant: 'fullstack' },
};
export default meta;

type Story = StoryObj<ResumePreviewModal>;

export const Fullstack: Story = {};

export const NextPage: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole('button', { name: 'Next page' }));
    await expect(page.getByText('Page 2 of 2')).toBeInTheDocument();
  },
};
