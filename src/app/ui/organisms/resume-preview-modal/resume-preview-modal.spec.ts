import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { RESUMES } from '../resume-section/resume-downloads.testing';
import { ResumePreviewModal } from './resume-preview-modal';

async function setup(variant = 'mobile') {
  const variantChange = vi.fn();
  const closed = vi.fn();
  const download = vi.fn();
  const view = await render(ResumePreviewModal, {
    inputs: { open: true, resumes: RESUMES, variant },
    on: { variantChange, closed, download },
  });
  const image = () => view.container.querySelector<HTMLImageElement>('img.resume-modal-page')!;
  return { ...view, variantChange, closed, download, image, user: userEvent.setup() };
}

describe('ResumePreviewModal', () => {
  it('opens on the chosen résumé, named for it, with its file name in the bar', async () => {
    const { image } = await setup();
    expect(screen.getByRole('dialog', { name: 'mobile title résumé preview' })).toBeTruthy();
    expect(screen.getByText('cv-mobile.pdf')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /mobile title/, selected: true })).toBeTruthy();
    expect(image().getAttribute('alt')).toBe('Page 1 of 2 of the mobile title résumé');
    expect(screen.getByText('A4 · 2 pages · 63 KB · Updated Nov 2026')).toBeTruthy();
  });

  it('is a tablist: one tab in the Tab order, the panel labelled by it', async () => {
    await setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[1].id);
  });

  it('switches résumés from a tab click or the arrow keys, staying open', async () => {
    const { variantChange, closed, user } = await setup();
    await user.click(screen.getByRole('tab', { name: /devops title/ }));
    expect(variantChange).toHaveBeenLastCalledWith('devops');
    screen.getByRole('tab', { name: /mobile title/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(variantChange).toHaveBeenLastCalledWith('fullstack');
    await user.keyboard('{ArrowRight}');
    expect(variantChange).toHaveBeenLastCalledWith('devops');
    expect(closed).not.toHaveBeenCalled();
  });

  it('pages through the images, and goes back to page 1 for another résumé', async () => {
    const { image, user, rerender } = await setup();
    const prev = screen.getByRole('button', { name: 'Previous page' });
    expect(prev.hasAttribute('disabled')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(image().getAttribute('src')).toBe('/resumes/cv-mobile-page-2.webp');
    expect(screen.getByText('Page 2 of 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled')).toBe(true);
    await rerender({
      inputs: { open: true, resumes: RESUMES, variant: 'devops' },
      partialUpdate: true,
    });
    expect(image().getAttribute('src')).toBe('/resumes/cv-devops-page-1.webp');
  });

  it('shows a skeleton page until the image loads', async () => {
    const { container, image } = await setup();
    expect(container.querySelector('.resume-modal-skeleton')).toBeTruthy();
    image().dispatchEvent(new Event('load'));
    await new Promise((r) => setTimeout(r));
    expect(container.querySelector('.resume-modal-skeleton')).toBeNull();
  });

  it('opens the PDF in a new tab, asks to download it, and asks to close', async () => {
    const { download, closed, user } = await setup();
    const open = screen.getByRole('link', { name: /Open PDF in new tab/ });
    expect(open.getAttribute('href')).toBe('/resumes/cv-mobile.pdf');
    expect(open.getAttribute('target')).toBe('_blank');
    await user.click(screen.getByRole('button', { name: /^Download$/ }));
    expect(download).toHaveBeenCalledWith('mobile');
    await user.click(screen.getByRole('button', { name: 'Close cv-mobile.pdf' }));
    expect(closed).toHaveBeenCalledOnce();
    screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(closed).toHaveBeenCalledTimes(2);
  });
});
