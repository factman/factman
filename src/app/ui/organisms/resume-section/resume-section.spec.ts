import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { RESUMES } from './resume-downloads.testing';
import { ResumeSection } from './resume-section';

describe('ResumeSection', () => {
  it("has a level-3 heading and a card per résumé with its first page's thumbnail", async () => {
    const { container } = await render(ResumeSection, { inputs: { resumes: RESUMES } });
    expect(
      screen.getByRole('heading', { level: 3, name: 'Pick the résumé that fits the role' }),
    ).toBeTruthy();
    expect(container.querySelectorAll('fm-resume-card')).toHaveLength(3);
    expect(container.querySelector('img')!.getAttribute('src')).toBe(
      // The small copy beside the print preview (ETE-126).
      '/resumes/cv-fullstack-page-1-thumb.webp',
    );
  });

  it('asks to preview or download a résumé by its slug', async () => {
    const preview = vi.fn();
    const download = vi.fn();
    await render(ResumeSection, { inputs: { resumes: RESUMES }, on: { preview, download } });
    await userEvent.click(screen.getByRole('button', { name: 'Preview mobile title résumé' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Download devops title résumé (PDF)' }),
    );
    expect(preview).toHaveBeenCalledWith('mobile');
    expect(download).toHaveBeenCalledWith('devops');
  });
});
