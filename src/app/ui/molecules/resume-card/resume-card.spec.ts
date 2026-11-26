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
    // Without a portrait, the data's icon stands in.
    expect(container.querySelector('.resume-card-icon')).toBeTruthy();
    expect(screen.getByText('PDF · A4')).toBeTruthy();
    expect(screen.getByText(resume.fileName)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: `Preview ${resume.title} résumé` }));
    await userEvent.click(
      screen.getByRole('button', { name: `Download ${resume.title} résumé (PDF)` }),
    );
    expect(preview).toHaveBeenCalledWith(resume);
    expect(download).toHaveBeenCalledWith(resume);
  });

  it('shows the portrait, and the pages, size and update date (the canvas card)', async () => {
    const { container } = await render(ResumeCard, {
      inputs: {
        resume: {
          ...resume,
          photo: '/assets/profile/odunayo-resume-fullstack-360.webp',
          pages: 2,
          size: '186 KB',
          updated: 'Nov 2026',
        },
      },
      providers: [provideIcons([iconLayout])],
    });
    const img = container.querySelector('.resume-card-avatar img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/assets/profile/odunayo-resume-fullstack-360.webp');
    // Decorative: the title names the card.
    expect(img.getAttribute('alt')).toBe('');
    expect(container.querySelector('.resume-card-icon')).toBeNull();
    const meta = [...container.querySelectorAll('.resume-card-meta span')].map(
      (s) => s.textContent,
    );
    expect(meta).toEqual(['2 pages', '186 KB', 'Updated Nov 2026']);
  });
});
