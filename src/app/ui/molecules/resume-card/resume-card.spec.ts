import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { iconLayout, provideIcons } from '@ui/atoms';

import { ResumeCard } from './resume-card';

const resume = {
  slug: 'fullstack',
  title: 'Fullstack Software Engineer',
  scope: 'Frontend and backend development for product and engineering roles.',
  icon: 'layout',
  fileName: 'odunayo-mohammed-fullstack.pdf',
};

describe('ResumeCard', () => {
  it('shows the variant and emits preview and download', async () => {
    const preview = vi.fn();
    const download = vi.fn();
    const { container } = await render(
      `<fm-resume-card [resume]="resume" (preview)="preview($event)" (download)="download($event)" />`,
      {
        imports: [ResumeCard],
        providers: [provideIcons([iconLayout])],
        componentProperties: { resume, preview, download },
      },
    );
    expect(screen.getByRole('heading', { level: 3, name: resume.title })).toBeTruthy();
    expect(screen.getByText(resume.scope)).toBeTruthy();
    expect(container.querySelector('.resume-card-page')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: `Preview ${resume.title} résumé` }));
    await userEvent.click(
      screen.getByRole('button', { name: `Download ${resume.title} résumé (PDF)` }),
    );
    expect(preview).toHaveBeenCalledWith(resume);
    expect(download).toHaveBeenCalledWith(resume);
  });

  it('shows the thumbnail when there is one', async () => {
    const { container } = await render(ResumeCard, {
      inputs: { resume, thumbnail: '/assets/resumes/fullstack.webp' },
      providers: [provideIcons([iconLayout])],
    });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/assets/resumes/fullstack.webp');
    expect(img.getAttribute('alt')).toBe('');
  });
});
