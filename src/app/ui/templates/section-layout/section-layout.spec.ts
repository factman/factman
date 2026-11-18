import { render, screen } from '@testing-library/angular';

import { ScrollSpy } from '@shared';

import { SectionLayout } from './section-layout';

describe('SectionLayout', () => {
  it('is a section named by its title, with an anchor, header, action and body', async () => {
    await render(
      `<fm-section-layout sectionId="services" index="04" eyebrow="Services" title="What I build" description="Web, mobile and payments.">
         <a sectionAction href="/services">All services</a>
         <p>Service cards</p>
       </fm-section-layout>`,
      { imports: [SectionLayout] },
    );
    const section = screen.getByRole('region', { name: 'What I build' });
    expect(section.id).toBe('services');
    expect(screen.getByRole('heading', { level: 2, name: 'What I build' }).id).toBe(
      'services-title',
    );
    expect(screen.getByRole('link', { name: 'All services' })).toBeTruthy();
    expect(screen.getByText('Service cards').closest('.section-layout-body')).toBeTruthy();
  });

  it('registers with the scroll-spy and stops on destroy', async () => {
    const stop = vi.fn();
    const register = vi.fn(() => stop);
    const { fixture } = await render(
      `<fm-section-layout sectionId="about" title="About" [tight]="true"><p>Body</p></fm-section-layout>`,
      { imports: [SectionLayout], providers: [{ provide: ScrollSpy, useValue: { register } }] },
    );
    expect(register).toHaveBeenCalledWith('about', screen.getByRole('region', { name: 'About' }));
    expect(screen.getByRole('region').classList).toContain('is-tight');
    fixture.destroy();
    expect(stop).toHaveBeenCalledOnce();
  });
});
